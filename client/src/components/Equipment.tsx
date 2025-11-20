import React, { useState, useEffect } from "react";
import {
  Plus,
  Monitor,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  UserX,
  Search,
  ChevronDown,
} from "lucide-react";
import { equipmentAPI, userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useSnackbar } from "../context/SnackbarContext";

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  status: "available" | "assigned" | "maintenance";
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    profilePictureUrl?: string;
  };
  serialNumber: string;
  purchaseDate: string;
  notes?: string;
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string;
}

const statusColors = {
  available:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  assigned:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  maintenance:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

// Add SearchableUserSelect component before Equipment component
const SearchableUserSelect = ({
  users,
  selectedUserId,
  onUserSelect,
  placeholder = "Search and select a member...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(
    (user) => user.id === selectedUserId
  );

  const handleSelect = (userId) => {
    onUserSelect(userId);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".searchable-dropdown")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative searchable-dropdown ${className}`}>
      <div
        className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white bg-white cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={
            selectedUser
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          {selectedUser ? selectedUser.name : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-9 pr-3 py-2 text-sm border dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-white"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <div
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
              onClick={() => handleSelect("")}
            >
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">
                  Unassigned
                </span>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No members found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                  onClick={() => handleSelect(user.id)}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Equipment = () => {
  const { isAdmin } = useAuth();
  const { showModal } = useModal();
  const { showSnackbar } = useSnackbar();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availableUsers, setAvailableUsers] = useState<
    AvailableUser[]
  >([]);
  const [allUsers, setAllUsers] = useState<AvailableUser[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [newEquipment, setNewEquipment] = useState<
    Partial<EquipmentItem> & { assignedToId?: string }
  >({
    name: "",
    type: "",
    status: "available",
    serialNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
    assignedToId: "",
  });

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await equipmentAPI.getEquipment();
        setEquipment(response.data);
      } catch (err) {
        console.error("Error fetching equipment:", err);
        setError(
          "Failed to load equipment data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchInitialData = async () => {
      await Promise.all([fetchEquipment(), fetchUsers()]);
    };

    fetchInitialData();
  }, []);

  // Fetch users when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchUsers();
    }
  }, [showAddModal]);

  const fetchUsers = async () => {
    try {
      const [availableRes, allRes] = await Promise.all([
        userAPI.getAvailableUsers(),
        userAPI.getUsers(),
      ]);
      setAvailableUsers(availableRes.data);
      setAllUsers(allRes.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleAddEquipment = async () => {
    if (
      !newEquipment.name ||
      !newEquipment.type ||
      !newEquipment.serialNumber
    )
      return;

    try {
      setLoading(true);
      const equipmentData = { ...newEquipment };

      // If assigning to a user, set the assignedTo field
      if (equipmentData.assignedToId) {
        equipmentData.assignedTo = equipmentData.assignedToId;
        equipmentData.status = "assigned";
      }

      // Remove the temporary assignedToId field
      delete equipmentData.assignedToId;

      const response = await equipmentAPI.createEquipment(
        equipmentData
      );
      setEquipment([...equipment, response.data]);
      setShowAddModal(false);
      resetForm();
      showSnackbar("Equipment added successfully!", "success");
    } catch (err) {
      console.error("Error adding equipment:", err);
      showSnackbar(
        "Failed to add equipment. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEquipment = async () => {
    if (
      !selectedEquipment ||
      !newEquipment.name ||
      !newEquipment.type ||
      !newEquipment.serialNumber
    )
      return;

    try {
      setLoading(true);
      const equipmentData = { ...newEquipment };

      // If assigning to a user, set the assignedTo field
      if (equipmentData.assignedToId) {
        equipmentData.assignedTo = equipmentData.assignedToId;
        if (equipmentData.status === "available") {
          equipmentData.status = "assigned";
        }
      } else if (equipmentData.assignedToId === "") {
        // If clearing assignment
        equipmentData.assignedTo = null;
        if (equipmentData.status === "assigned") {
          equipmentData.status = "available";
        }
      }

      // Remove the temporary assignedToId field
      delete equipmentData.assignedToId;

      const response = await equipmentAPI.updateEquipment(
        selectedEquipment.id,
        equipmentData
      );
      setEquipment(
        equipment.map((item) =>
          item.id === selectedEquipment.id ? response.data : item
        )
      );
      setShowAddModal(false);
      resetForm();
      showSnackbar("Equipment updated successfully!", "success");
    } catch (err) {
      console.error("Error updating equipment:", err);
      showSnackbar(
        "Failed to update equipment. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick assignment function
  const handleQuickAssignment = async (
    equipmentId: string,
    userId: string
  ) => {
    try {
      const updateData = userId
        ? { assignedTo: userId, status: "assigned" }
        : { assignedTo: null, status: "available" };

      const response = await equipmentAPI.updateEquipment(
        equipmentId,
        updateData
      );

      setEquipment(
        equipment.map((item) =>
          item.id === equipmentId ? response.data : item
        )
      );

      showSnackbar(
        userId
          ? "Equipment assigned successfully!"
          : "Equipment unassigned successfully!",
        "success"
      );
    } catch (err) {
      console.error("Error updating assignment:", err);
      showSnackbar(
        "Failed to update assignment. Please try again.",
        "error"
      );
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    showModal({
      title: "Confirm Equipment Deletion",
      message:
        "Are you sure you want to delete this equipment? This action cannot be undone.",
      type: "warning",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setLoading(true);
          await equipmentAPI.deleteEquipment(id);
          setEquipment(equipment.filter((item) => item.id !== id));
          showSnackbar("Equipment deleted successfully!", "success");
        } catch (err) {
          console.error("Error deleting equipment:", err);
          showSnackbar(
            "Failed to delete equipment. Please try again.",
            "error"
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleEditEquipment = (item: EquipmentItem) => {
    setSelectedEquipment(item);
    setNewEquipment({
      name: item.name,
      type: item.type,
      status: item.status,
      serialNumber: item.serialNumber,
      assignedToId: item.assignedTo?._id || "",
      purchaseDate: item.purchaseDate.split("T")[0],
      notes: item.notes,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setSelectedEquipment(null);
    setNewEquipment({
      name: "",
      type: "",
      status: "available",
      serialNumber: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
      assignedToId: "",
    });
  };

  // Get unique equipment types for filter dropdown
  const equipmentTypes = [
    ...new Set(equipment.map((item) => item.type)),
  ];

  // Filter equipment based on status, type, and search query
  const filteredEquipment = equipment.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesType =
      typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (item.notes &&
        item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Pagination calculations
  const totalItems = filteredEquipment.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEquipment = filteredEquipment.slice(
    startIndex,
    endIndex
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(
        totalPages,
        startPage + maxVisiblePages - 1
      );

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Check if the user has permission to manage equipment
  const userCanManageEquipment = () => {
    // Only admins can manage equipment
    return isAdmin();
  };

  // Loading state with shimmer effect
  if (loading && equipment.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap gap-4 mb-6 animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </div>

          <div className="overflow-x-auto">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Equipment
        </h1>
        {userCanManageEquipment() && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Equipment
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search equipment..."
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Types</option>
            {equipmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {filteredEquipment.length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              No Equipment Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {equipment.length === 0
                ? "Start by adding your first equipment item."
                : "No equipment matches your current filters."}
            </p>
            {equipment.length === 0 && userCanManageEquipment() && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add First Equipment
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Items per page selector and results info */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Show:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(Number(e.target.value))
                    }
                    className="px-3 py-1 border dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    items per page
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, totalItems)} of {totalItems} items
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3">Serial Number</th>
                    <th className="px-6 py-3">Purchase Date</th>
                    <th className="px-6 py-3">Notes</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEquipment.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b dark:border-gray-700"
                    >
                      <td className="px-6 py-4 font-medium">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">{item.type}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[item.status]
                          }`}
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {userCanManageEquipment() ? (
                          <SearchableUserSelect
                            users={allUsers}
                            selectedUserId={
                              item.assignedTo?._id || ""
                            }
                            onUserSelect={(userId) =>
                              handleQuickAssignment(item.id, userId)
                            }
                            placeholder="Select member..."
                            className="min-w-[200px]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            {item.assignedTo ? (
                              <>
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                  {item.assignedTo.name}
                                </span>
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  Unassigned
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.serialNumber}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(
                          item.purchaseDate
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate">
                          {item.notes || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {userCanManageEquipment() && (
                            <>
                              <button
                                onClick={() =>
                                  handleEditEquipment(item)
                                }
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteEquipment(item.id)
                                }
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      <React.Fragment key={index}>
                        {page === "..." ? (
                          <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            ...
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handlePageChange(page as number)
                            }
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === page
                                ? "text-indigo-600 bg-indigo-50 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-600"
                                : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {selectedEquipment
                ? "Edit Equipment"
                : "Add New Equipment"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newEquipment.name}
                  onChange={(e) =>
                    setNewEquipment({
                      ...newEquipment,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Equipment name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  value={newEquipment.type}
                  onChange={(e) =>
                    setNewEquipment({
                      ...newEquipment,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Laptop, Monitor, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={newEquipment.serialNumber}
                  onChange={(e) =>
                    setNewEquipment({
                      ...newEquipment,
                      serialNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Serial number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newEquipment.status}
                    onChange={(e) =>
                      setNewEquipment({
                        ...newEquipment,
                        status: e.target.value as
                          | "available"
                          | "assigned"
                          | "maintenance",
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={newEquipment.purchaseDate}
                    onChange={(e) =>
                      setNewEquipment({
                        ...newEquipment,
                        purchaseDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign to Member
                </label>
                <SearchableUserSelect
                  users={allUsers}
                  selectedUserId={newEquipment.assignedToId || ""}
                  onUserSelect={(userId) => {
                    setNewEquipment({
                      ...newEquipment,
                      assignedToId: userId,
                      status: userId
                        ? "assigned"
                        : newEquipment.status === "assigned"
                        ? "available"
                        : newEquipment.status,
                    });
                  }}
                  placeholder="Search and select a member..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selecting a member will automatically set status to
                  "Assigned"
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={newEquipment.notes}
                  onChange={(e) =>
                    setNewEquipment({
                      ...newEquipment,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    selectedEquipment
                      ? handleUpdateEquipment
                      : handleAddEquipment
                  }
                  disabled={
                    !newEquipment.name ||
                    !newEquipment.type ||
                    !newEquipment.serialNumber
                  }
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    loading ? "opacity-70 cursor-wait" : ""
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : selectedEquipment ? (
                    "Update Equipment"
                  ) : (
                    "Add Equipment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
