import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// LibraryEntry type for course listings
export interface LibraryEntry {
  id: string;
  title: string;
  status: 'draft' | 'published';
  folder: string;
  tags: string[];
  createdAt: string;
  modifiedAt: string;
  createdBy?: string;
  thumbnailPath?: string;
}

// Folder structure
export interface FolderNode {
  id: string;
  name: string;
  type?: 'library' | 'team' | 'personal' | 'folder';
  children?: FolderNode[];
  courseCount?: number;
}

// Course data for mutations
export interface CourseData {
  id?: string;
  title?: string;
  desiredOutcome?: string;
  destinationFolder?: string;
  categoryTags?: string[];
  dataSource?: string;
  personas?: any[];
  learningObjectives?: any[];
  assessmentSettings?: any;
  content?: any;
  status?: 'draft' | 'published' | 'generated';
  metadata?: any;
  settings?: any;
  sections?: any[];
  [key: string]: any; // Allow additional properties
}

// Billing types
export interface BillingInfo {
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'none';
  seat_count: number;
  price_per_seat: number; // cents
  current_period_end?: number; // unix timestamp
  cancel_at_period_end: boolean;
}

export interface CheckoutResponse {
  url: string;
}

export interface PortalResponse {
  url: string;
}

// Backend API base URL - billing endpoints go to the Go backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * RTK Query API slice for all server communication
 *
 * Tag System:
 * - 'Course' tag: Invalidated when courses are created/updated/deleted
 * - 'Folder' tag: Invalidated when courses are created/updated/deleted (counts change)
 *
 * This eliminates manual cache invalidation - mutations automatically
 * refetch any queries that use the invalidated tags.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    // For billing endpoints that need the backend, we override in each endpoint
  }),
  tagTypes: ['Course', 'Folder', 'Billing'],
  endpoints: (builder) => ({
    // ============ QUERIES ============

    /**
     * Get folder hierarchy with optional course counts
     * Provides: ['Folder'] tag
     */
    getFolders: builder.query<FolderNode[], boolean>({
      query: (includeCourseCount = true) => `/folders?includeCourseCount=${includeCourseCount}`,
      transformResponse: (response: { success: boolean; data: FolderNode[] }) => response.data,
      providesTags: ['Folder']
    }),

    /**
     * Get all courses (library entries)
     * Provides: ['Course'] tag
     */
    getCourses: builder.query<LibraryEntry[], void>({
      query: () => '/courses',
      transformResponse: (response: { success: boolean; data: LibraryEntry[] }) => response.data,
      providesTags: ['Course']
    }),

    /**
     * Get a specific course by ID
     * Provides: ['Course'] tag with ID
     */
    getCourse: builder.query<any, string>({
      query: (id) => `/courses/${id}`,
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: (result, error, id) => [{ type: 'Course', id }]
    }),

    // ============ MUTATIONS ============

    /**
     * Create a new course
     * Invalidates: ['Course', 'Folder'] - refetches course lists and folder counts
     */
    createCourse: builder.mutation<any, CourseData>({
      query: (courseData) => ({
        url: '/courses',
        method: 'POST',
        body: {
          ...courseData,
          // Ensure we have an ID for the course
          id: courseData.id || `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      invalidatesTags: ['Course', 'Folder']
    }),

    /**
     * Update an existing course
     * Invalidates: ['Course', 'Folder'] - refetches course lists and folder counts
     */
    updateCourse: builder.mutation<any, { id: string; data: CourseData }>({
      query: ({ id, data }) => ({
        url: `/courses/${id}`,
        method: 'PUT',
        body: data
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        'Course',
        'Folder',
        { type: 'Course', id }
      ]
    }),

    /**
     * Delete a course
     * Invalidates: ['Course', 'Folder'] - refetches course lists and folder counts
     */
    deleteCourse: builder.mutation<void, string>({
      query: (id) => ({
        url: `/courses/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Course', 'Folder']
    }),

    // ============ BILLING ============
    // Billing endpoints go to the Go backend (different from course endpoints)

    /**
     * Get current billing info
     * Provides: ['Billing'] tag
     */
    getBilling: builder.query<BillingInfo, void>({
      queryFn: async (_, _queryApi, _extraOptions, baseQuery) => {
        const result = await fetch(`${API_BASE_URL}/api/v1/billing`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!result.ok) {
          return { error: { status: result.status, data: 'Failed to fetch billing' } };
        }
        const json = await result.json();
        return { data: json.data };
      },
      providesTags: ['Billing']
    }),

    /**
     * Create Stripe checkout session
     * Returns URL to redirect user to Stripe Checkout
     */
    createCheckoutSession: builder.mutation<CheckoutResponse, { plan: 'starter' | 'pro' }>({
      queryFn: async (body) => {
        const result = await fetch(`${API_BASE_URL}/api/v1/billing/checkout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!result.ok) {
          return { error: { status: result.status, data: 'Failed to create checkout session' } };
        }
        const json = await result.json();
        return { data: json.data };
      }
    }),

    /**
     * Create Stripe customer portal session
     * Returns URL to redirect user to Stripe Customer Portal
     */
    createPortalSession: builder.mutation<PortalResponse, void>({
      queryFn: async () => {
        const result = await fetch(`${API_BASE_URL}/api/v1/billing/portal`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!result.ok) {
          return { error: { status: result.status, data: 'Failed to create portal session' } };
        }
        const json = await result.json();
        return { data: json.data };
      }
    })
  })
});

// Export hooks for usage in components
export const {
  useGetFoldersQuery,
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  // Billing hooks
  useGetBillingQuery,
  useCreateCheckoutSessionMutation,
  useCreatePortalSessionMutation,
} = api;
