export const calendarEventFields = `
  fragment CalendarEventFields on TeachingCalendarEvent {
    id batchId title startAt endAt date startTime endTime schoolId schoolName
    classId className subjectId subjectName levelId levelName roomId roomName
    periodStart periodCount teachers { userId displayName role colorKey }
    status note colorGroup { key label kind }
  }
`;

export const workspaceFields = `
  ${calendarEventFields}
  fragment FilterOptionFields on TeachingCalendarFilterOption { id label count colorKey }
  fragment LaneSummaryFields on TeachingCalendarLaneSummary { id label count colorKey }
  fragment CatalogFields on TeachingScheduleCatalog {
    schools { ...FilterOptionFields }
    classes { id schoolId label grade academicYear }
    teachers { id label colorKey }
    assistantTeachers { id label colorKey }
    subjects { id label }
    levels { id subjectId label sortOrder }
    rooms { id label schoolId }
  }
  fragment WorkspaceFields on TeachingCalendarWorkspace {
    tenantId from to viewMode events { ...CalendarEventFields }
    filterOptions {
      schools { ...FilterOptionFields }
      classes { ...FilterOptionFields }
      teachers { ...FilterOptionFields }
      subjects { ...FilterOptionFields }
      levels { ...FilterOptionFields }
    }
    laneSummaries { ...LaneSummaryFields }
    catalog { ...CatalogFields }
    permissions { canCreate canUpdate canDelete canPublish canViewAggregate }
    generatedAt
  }
`;

export const previewPayloadFields = `
  valid previewEventCount teacherScheduleCount totalPeriodCount
  rowResults {
    clientRowId valid eventCount teacherScheduleCount
    errors { code field message }
    warnings { code field message }
  }
  conflicts { code severity clientRowId existingEventId message }
`;

export const bulkPayloadFields = `
  batchId createdEventCount teacherScheduleCount totalPeriodCount
  rowResults {
    clientRowId valid eventCount teacherScheduleCount
    errors { code field message }
    warnings { code field message }
  }
  conflicts { code severity clientRowId existingEventId message }
`;
