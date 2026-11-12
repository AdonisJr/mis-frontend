import { defineStore } from 'pinia'
import { fetchActiveSchoolYear } from '@/services/schoolYearService.js'
import { fetchActiveTerm } from '@/services/termService.js'

export const useSchoolYearStore = defineStore('schoolYear', {
  state: () => ({
    activeSchoolYear: null,
    isActiveSchoolYearLoading: false,
    activeSchoolYearVersion: 0,
    activeTerm: null,
    activeTermVersion: 0,
  }),

  actions: {
    async loadActiveSchoolYear() {
      this.activeSchoolYearVersion += 1
      const requestVersion = this.activeSchoolYearVersion
      this.isActiveSchoolYearLoading = true
      try {
        const activeResponse = await fetchActiveSchoolYear()
        // a newer set-active, edit or logout already decided the value; this response is stale
        if (requestVersion !== this.activeSchoolYearVersion) return
        this.activeSchoolYear = activeResponse?.school_year ?? null
      } catch (error) {
        if (requestVersion !== this.activeSchoolYearVersion) return
        this.activeSchoolYear = null
        throw error
      } finally {
        if (requestVersion === this.activeSchoolYearVersion) this.isActiveSchoolYearLoading = false
      }
    },

    replaceActiveSchoolYear(schoolYear) {
      if (!schoolYear || typeof schoolYear !== 'object') return
      this.activeSchoolYearVersion += 1
      this.activeSchoolYear = schoolYear
      this.isActiveSchoolYearLoading = false
    },

    clearActiveSchoolYear() {
      this.activeSchoolYearVersion += 1
      this.activeSchoolYear = null
      this.isActiveSchoolYearLoading = false
    },

    async loadActiveTerm() {
      this.activeTermVersion += 1
      const requestVersion = this.activeTermVersion
      try {
        const activeResponse = await fetchActiveTerm()
        // a newer set-active, edit or logout already decided the value; this response is stale
        if (requestVersion !== this.activeTermVersion) return
        this.activeTerm = activeResponse?.term ?? null
      } catch (error) {
        if (requestVersion !== this.activeTermVersion) return
        this.activeTerm = null
        throw error
      }
    },

    replaceActiveTerm(term) {
      if (!term || typeof term !== 'object') return
      this.activeTermVersion += 1
      this.activeTerm = term
    },

    clearActiveTerm() {
      this.activeTermVersion += 1
      this.activeTerm = null
    },
  },
})
