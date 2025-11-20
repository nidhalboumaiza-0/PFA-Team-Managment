# Team Leader Task Management Permissions

This document outlines the implementation of the team leader task
management permission system.

## Overview

The system has been updated to include a new permission flag for team
leaders called `canManageTasks`. This flag controls whether team
leaders can create, edit, or delete tasks for their team. By default,
this permission is disabled and must be enabled by an admin.

## Key Changes

1. **User Model**

   - Added `canManageTasks` boolean property to the User type
   - Updated the user transformer to include this property

2. **Authentication Context**

   - Added `canManageTasks()` method to check if a user has permission
     to manage tasks
   - This method returns true for admins and for team leaders with the
     permission enabled

3. **API Services**

   - Added support for the `/users/toggle-task-permission/:userId`
     endpoint in the user API

4. **Components**

   - Created a new `TeamLeaderPermissions` component for admins to
     manage permissions
   - Updated the Tasks component to check for task management
     permissions before showing add/edit/delete options
   - Added the permissions management UI to the Admin dashboard

5. **Login Flow**
   - Updated error handling for login to show appropriate messages
     when non-admin or non-team leader users try to log in

## Using Task Management Permissions

### For Admins:

1. Log in as an admin
2. Navigate to the Admin dashboard
3. Scroll down to the "Team Leader Permissions" section
4. Use the toggle buttons to enable or disable task management for
   each team leader

### For Team Leaders:

1. Log in as a team leader
2. If you have task management permissions enabled, you will see
   options to:
   - Add new tasks
   - Edit existing tasks
   - Delete tasks
3. If permissions are not enabled, you can only view tasks and mark
   them as complete

## Technical Implementation

The permission check is performed using the `canManageTasks()` method
from the auth context:

```typescript
const canManageTasks = () => {
  return (
    isAdmin() || (isTeamLeader() && user?.canManageTasks === true)
  );
};
```

This ensures that:

1. Admins always have full task management capabilities
2. Team leaders only have task management capabilities if explicitly
   enabled
3. Regular users never have task management capabilities
