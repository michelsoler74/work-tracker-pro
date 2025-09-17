// Utilidades para búsqueda y filtrado
import { debounce } from './helpers.js';

export class SearchService {
  constructor() {
    this.searchCache = new Map();
    this.debouncedSearch = debounce(this.performSearch.bind(this), 300);
  }

  // Búsqueda fuzzy simple
  fuzzyMatch(text, searchTerm) {
    if (!searchTerm || !text) return true;

    const cleanText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanSearch = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return cleanText.includes(cleanSearch);
  }

  // Búsqueda en múltiples campos
  searchInMultipleFields(item, searchTerm, fields) {
    if (!searchTerm) return true;

    return fields.some(field => {
      const value = this.getNestedValue(item, field);
      return value && this.fuzzyMatch(String(value), searchTerm);
    });
  }

  // Obtener valor anidado de un objeto
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Búsqueda de trabajos
  searchJobs(jobs, searchTerm, statusFilter = '') {
    const cacheKey = `jobs_${searchTerm}_${statusFilter}`;

    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    let filteredJobs = jobs;

    // Filtrar por texto de búsqueda
    if (searchTerm) {
      const searchFields = ['title', 'description', 'workers.name'];
      filteredJobs = filteredJobs.filter(job =>
        this.searchInMultipleFields(job, searchTerm, searchFields)
      );
    }

    // Filtrar por estado
    if (statusFilter) {
      filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
    }

    // Ordenar por relevancia y fecha
    filteredJobs.sort((a, b) => {
      // Priorizar trabajos que coincidan exactamente en el título
      if (searchTerm) {
        const aExactMatch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
        const bExactMatch = b.title.toLowerCase().includes(searchTerm.toLowerCase());

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
      }

      // Luego por fecha (más recientes primero)
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });

    // Cachear resultado
    this.searchCache.set(cacheKey, filteredJobs);

    return filteredJobs;
  }

  // Búsqueda de trabajadores
  searchWorkers(workers, searchTerm) {
    const cacheKey = `workers_${searchTerm}`;

    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    let filteredWorkers = workers;

    // Filtrar por texto de búsqueda
    if (searchTerm) {
      const searchFields = ['name', 'specialty', 'email', 'phone'];
      filteredWorkers = filteredWorkers.filter(worker =>
        this.searchInMultipleFields(worker, searchTerm, searchFields)
      );
    }

    // Ordenar por relevancia
    filteredWorkers.sort((a, b) => {
      if (searchTerm) {
        const aExactMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const bExactMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
      }

      // Luego alfabéticamente
      return a.name.localeCompare(b.name);
    });

    // Cachear resultado
    this.searchCache.set(cacheKey, filteredWorkers);

    return filteredWorkers;
  }

  // Limpiar caché de búsqueda
  clearCache() {
    this.searchCache.clear();
  }

  // Búsqueda con debounce
  performSearch(callback, ...args) {
    callback(...args);
  }

  // Buscar con debounce
  searchWithDebounce(callback, ...args) {
    this.debouncedSearch(callback, ...args);
  }

  // Destacar texto encontrado
  highlightMatch(text, searchTerm) {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Estadísticas de búsqueda
  getSearchStats(originalCount, filteredCount, searchTerm) {
    return {
      total: originalCount,
      filtered: filteredCount,
      hidden: originalCount - filteredCount,
      searchTerm,
      hasResults: filteredCount > 0,
      percentage: originalCount > 0 ? Math.round((filteredCount / originalCount) * 100) : 0
    };
  }
}

// Instancia singleton
export const searchService = new SearchService();