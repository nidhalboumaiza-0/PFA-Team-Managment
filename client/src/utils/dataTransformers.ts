// Utility functions to transform backend data to match frontend expectations

export const transformTask = (task: any) => {
  // Return null if task is null or undefined
  if (!task) {
    console.warn("Attempted to transform a null or undefined task");
    return null;
  }

  return {
    id: task._id || task.id,
    title: task.title || "",
    description: task.description || "",
    status: task.status || "pending",
    priority: task.priority || "medium",
    dueDate: task.dueDate || new Date().toISOString(),
    assignedTo:
      typeof task.assignedTo === "object"
        ? task.assignedTo?._id || task.assignedTo || ""
        : task.assignedTo || "",
    teamId:
      typeof task.teamId === "object"
        ? task.teamId?._id || task.teamId || ""
        : task.teamId || "",
    projectId:
      typeof task.projectId === "object"
        ? task.projectId?._id || task.projectId || ""
        : task.projectId || "",
    createdAt: task.createdAt || new Date().toISOString(),
    completedAt: task.completedAt || null,
  };
};

export const transformTeam = (team: any) => {
  return {
    id: team._id || team.id,
    name: team.name,
    description: team.description || "",
    members:
      team.members?.map((member: any) => {
        if (member.user && typeof member.user === "object") {
          return {
            id: member.user._id || member.user.id,
            name: member.user.name || "",
            email: member.user.email || "",
            phone: member.user.phone || "",
            role: member.role || "Member",
            avatar: member.user.avatar,
            profilePictureUrl: member.user.profilePictureUrl,
          };
        }
        // If member is already in the expected format
        return {
          id: member.id || member._id,
          name: member.name || "",
          email: member.email || "",
          phone: member.phone || "",
          role: member.role || "Member",
          avatar: member.avatar,
          profilePictureUrl: member.profilePictureUrl,
        };
      }) || [],
    createdAt: team.createdAt,
  };
};

export const transformEquipment = (equipment: any) => {
  return {
    id: equipment._id || equipment.id,
    name: equipment.name,
    type: equipment.type,
    status: equipment.status,
    assignedTo: equipment.assignedTo
      ? typeof equipment.assignedTo === "object"
        ? equipment.assignedTo
        : {
            _id: equipment.assignedTo,
            name: "Unknown User",
            email: "",
          }
      : null,
    serialNumber: equipment.serialNumber,
    purchaseDate: equipment.purchaseDate,
    notes: equipment.notes || "",
  };
};

export const transformUser = (user: any) => {
  if (!user) return null;

  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    teamId:
      typeof user.teamId === "object"
        ? user.teamId._id || user.teamId
        : user.teamId,
    avatar: user.avatar,
    profilePictureUrl: user.profilePictureUrl,
    canManageTasks:
      user.canManageTasks !== undefined ? user.canManageTasks : false,
  };
};
