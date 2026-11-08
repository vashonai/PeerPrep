import { categoriesApi } from '../services/api'
import { useAsync } from './useAsync'

/** Courses with nested topics and question counts. */
export function useCourses() {
  const { data, ...rest } = useAsync(() => categoriesApi.listCourses(), [])
  return { courses: data ?? [], ...rest }
}
