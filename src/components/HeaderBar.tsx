import React, { useState } from "react";
import type { SortField, FilterField, CellViewMode } from "../App";

interface HeaderBarProps {
  onHideFields: (fields: string[]) => void;
  onSort: (field: SortField | null, order: "asc" | "desc" | null) => void;
  onFilter: (field: FilterField | null, value: string) => void;
  onSearch: (term: string) => void;
  onCellView: (mode: CellViewMode) => void;
  hiddenFields: string[];
  sortField: SortField | null;
  sortOrder: "asc" | "desc" | null;
  filterField: FilterField | null;
  filterValue: string;
  searchTerm: string;
  cellViewMode: CellViewMode;
}

export default function HeaderBar({
  onHideFields,
  onSort,
  onFilter,
  onSearch,
  onCellView,
  hiddenFields,
  sortField,
  sortOrder,
  filterField,
  filterValue,
  searchTerm,
  cellViewMode,
}: HeaderBarProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [showHideFieldsDropdown, setShowHideFieldsDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCellViewDropdown, setShowCellViewDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSpreadsheetMenu, setShowSpreadsheetMenu] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  // Local state for pending filter changes
  const [pendingFilterField, setPendingFilterField] =
    useState<FilterField | null>(filterField);
  const [pendingFilterValue, setPendingFilterValue] =
    useState<string>(filterValue);

  // Mock notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "info",
      message: "New comment on social media campaign",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "success",
      message: "Press kit update completed",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      type: "warning",
      message: "Financial report deadline approaching",
      time: "3 hours ago",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // All available fields with their display names
  const availableFields = [
    { key: "jobRequest", label: "Job Request" },
    { key: "submitted", label: "Submitted" },
    { key: "status", label: "Status" },
    { key: "submitter", label: "Submitter" },
    { key: "url", label: "URL" },
    { key: "assigned", label: "Assigned" },
    { key: "priority", label: "Priority" },
    { key: "dueDate", label: "Due Date" },
    { key: "estValue", label: "Est. Value" },
  ];

  const sortOptions: { key: SortField | null; label: string }[] = [
    { key: null, label: "None" },
    { key: "submitted", label: "Submitted Date" },
    { key: "status", label: "Status" },
    { key: "submitter", label: "Submitter" },
    { key: "priority", label: "Priority" },
    { key: "dueDate", label: "Due Date" },
    { key: "estValue", label: "Est. Value" },
  ];

  const filterOptions: {
    key: FilterField;
    label: string;
    type: "select" | "text" | "date";
    options?: string[];
  }[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["in-progress", "need to start", "complete", "blocked"],
    },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: ["High", "Medium", "Low"],
    },
    { key: "submitter", label: "Submitter", type: "text" },
    { key: "assigned", label: "Assigned", type: "text" },
    { key: "submitted", label: "Submitted Date", type: "date" },
    { key: "dueDate", label: "Due Date", type: "date" },
    { key: "estValue", label: "Est. Value", type: "text" },
  ];

  const cellViewOptions: {
    key: CellViewMode;
    label: string;
    description: string;
  }[] = [
    {
      key: "compact",
      label: "Compact",
      description: "Smaller cells, minimal padding",
    },
    { key: "normal", label: "Normal", description: "Standard cell size" },
    {
      key: "expanded",
      label: "Expanded",
      description: "Larger cells, more content visible",
    },
  ];

  const handleFieldVisibilityToggle = (fieldKey: string) => {
    const newHiddenFields = hiddenFields.includes(fieldKey)
      ? hiddenFields.filter((f) => f !== fieldKey)
      : [...hiddenFields, fieldKey];
    onHideFields(newHiddenFields);
  };

  const handleSortSelect = (field: SortField | null) => {
    if (field === null) {
      onSort(null, null);
    } else if (sortField === field) {
      // Cycle through: asc -> desc -> none
      if (sortOrder === "asc") {
        onSort(field, "desc");
      } else if (sortOrder === "desc") {
        onSort(null, null);
      } else {
        onSort(field, "asc");
      }
    } else {
      onSort(field, "asc");
    }
    setShowSortDropdown(false);
  };

  const handlePendingFilterChange = (field: FilterField, value: string) => {
    setPendingFilterField(field);
    setPendingFilterValue(value);
  };

  const handleApplyFilter = () => {
    if (pendingFilterField && pendingFilterValue.trim()) {
      onFilter(pendingFilterField, pendingFilterValue);
    } else {
      onFilter(null, "");
    }
    setShowFilterDropdown(false);
  };

  const handleCancelFilter = () => {
    setPendingFilterField(filterField);
    setPendingFilterValue(filterValue);
    setShowFilterDropdown(false);
  };

  const handleClearFilter = () => {
    setPendingFilterField(null);
    setPendingFilterValue("");
  };

  const handleCellViewSelect = (mode: CellViewMode) => {
    onCellView(mode);
    setShowCellViewDropdown(false);
  };

  const handleNotificationClick = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, unread: false } : n))
    );
    console.log(`Notification ${notificationId} clicked`);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    console.log("All notifications marked as read");
  };

  const handleSpreadsheetMenuAction = (action: string) => {
    console.log(`Spreadsheet menu action: ${action}`);
    setShowSpreadsheetMenu(false);

    switch (action) {
      case "rename": {
        const newName = prompt("Enter new spreadsheet name:", "Spreadsheet 3");
        if (newName) {
          alert(`Spreadsheet renamed to "${newName}"`);
        }
        break;
      }
      case "duplicate":
        alert("Spreadsheet duplicated successfully!");
        break;
      case "share":
        alert("Share dialog opened");
        break;
      case "export":
        alert("Export options opened");
        break;
      case "delete":
        if (confirm("Are you sure you want to delete this spreadsheet?")) {
          alert("Spreadsheet deleted");
        }
        break;
      default:
        break;
    }
  };

  const handleImportExportShare = (action: string) => {
    console.log(`${action} clicked`);

    switch (action) {
      case "Import": {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv,.xlsx,.json";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            alert(`Importing file: ${file.name}`);
          }
        };
        input.click();
        break;
      }

      case "Export": {
        const data = [
          [
            "Job Request",
            "Submitted",
            "Status",
            "Submitter",
            "URL",
            "Assigned",
            "Priority",
            "Due Date",
            "Est. Value",
          ],
          [
            "Launch social media campaign",
            "15-11-2024",
            "In-process",
            "Aisha Patel",
            "www.aishapatel.com",
            "Sophie Choudhury",
            "Medium",
            "20-11-2024",
            "6,200,000",
          ],
        ];
        const csvContent = data.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "spreadsheet-export.csv";
        a.click();
        URL.revokeObjectURL(url);
        alert("Data exported as CSV file");
        break;
      }

      case "Share": {
        if (navigator.share) {
          navigator.share({
            title: "Spreadsheet 3",
            text: "Check out this spreadsheet",
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => {
            alert("Share link copied to clipboard!");
          });
        }
        break;
      }

      default:
        break;
    }
  };

  const handleNewAction = () => {
    console.log("New Action clicked");
    const actionName = prompt("Enter new action name:");
    if (actionName) {
      alert(`New action "${actionName}" created successfully!`);
    }
  };

  const handleUserProfile = () => {
    console.log("User profile clicked");
    const action = confirm("Do you want to edit your profile?");
    if (action) {
      alert("Profile editor opened (demo)");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchTerm.trim()) {
      setIsSearching(true);
      console.log(`Searching for: ${localSearchTerm}`);
      onSearch(localSearchTerm.trim());

      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  };

  const clearSearch = () => {
    setLocalSearchTerm("");
    setIsSearching(false);
    onSearch("");
    console.log("Search cleared");
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm relative z-[10000]">
      {/* Top row - Brand/Logo, Spreadsheet Name, Search, Notifications, Profile */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2">
        {/* Left side - Brand/Logo and Spreadsheet Name */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
          {/* Brand/Logo */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-800 hidden sm:block">
              Spreadsheet Pro
            </div>
          </div>

          {/* Breadcrumb and Spreadsheet Name */}
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 truncate">
              <span className="truncate">Home</span>
              <svg
                className="w-3 h-3 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="truncate">Spreadsheets</span>
              <svg
                className="w-3 h-3 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <span className="text-sm sm:text-base font-medium text-gray-800 truncate">
              <span className="hidden md:inline">Spreadsheet 3</span>
              <span className="md:hidden">Sheet 3</span>
            </span>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowSpreadsheetMenu(!showSpreadsheetMenu)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors  bg-white shadow-sm"
                title="More options"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {showSpreadsheetMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]">
                  <div className="py-1">
                    <button
                      onClick={() => handleSpreadsheetMenuAction("rename")}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Rename spreadsheet
                    </button>
                    <button
                      onClick={() => handleSpreadsheetMenuAction("duplicate")}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleSpreadsheetMenuAction("share")}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Share settings
                    </button>
                    <button
                      onClick={() => handleSpreadsheetMenuAction("export")}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export options
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => handleSpreadsheetMenuAction("delete")}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete spreadsheet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search, Notifications and User */}
        <div className="flex items-center w-full space-x-2 sm:flex-none sm:justify-end sm:space-x-3 md:w-auto lg:w-auto min-w-0 flex-shrink-0">
          {/* Search bar */}
          <div className="flex-1 sm:flex-none md:flex-none min-w-0">
            <form
              onSubmit={handleSearch}
              className="flex items-center space-x-2 min-w-0"
            >
              <svg
                className="w-4 h-4 text-gray-400 hidden sm:block flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={localSearchTerm}
                onChange={(e) => {
                  setLocalSearchTerm(e.target.value);
                  // Real-time search as user types
                  if (e.target.value === "") {
                    onSearch("");
                  } else {
                    onSearch(e.target.value);
                  }
                }}
                placeholder="Search..."
                className={`border border-gray-300 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent w-full sm:w-32 md:w-36 lg:w-48 bg-gray-50 min-w-0 ${
                  isSearching ? "bg-yellow-50" : ""
                }`}
                disabled={isSearching}
              />
              {localSearchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </form>
          </div>

          {/* Notifications and Profile grouped together */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors  bg-white shadow-sm"
                title="Notifications"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.73 21a2 2 0 0 1-3.46 0"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:top-1 sm:right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-1 w-72 sm:w-80 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]">
                  <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          notification.unread ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === "info"
                                ? "bg-blue-500"
                                : notification.type === "success"
                                ? "bg-green-500"
                                : notification.type === "warning"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                          />
                          <div className="flex-1">
                            <p
                              className={`text-sm ${
                                notification.unread
                                  ? "font-medium text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {notifications.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile */}
            <button
              onClick={handleUserProfile}
              className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-200 rounded transition-colors min-w-0"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                JD
              </div>
              <div className="text-xs hidden sm:block min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  John Doe
                </div>
                <div
                  className="text-gray-500 text-xs truncate"
                  title="johndoe@email.com"
                >
                  <span className="hidden md:inline">johndoe@email.com</span>
                  <span className="md:hidden">john@...</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row - Toolbar and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-3 sm:px-4 py-2 bg-gray-50 space-y-2 lg:space-y-0">
        {/* Mobile toolbar toggle */}
        <div className="flex items-center justify-between lg:hidden">
          <div className="flex items-center space-x-1 text-sm">
            <span className="font-medium text-gray-700">Tool bar</span>
            <svg
              className="w-3 h-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
          <button
            onClick={() => setShowMobileToolbar(!showMobileToolbar)}
            className="flex items-center space-x-1 px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors font-medium text-gray-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span>Tools</span>
          </button>
        </div>

        <div className="flex">
          {/* Desktop toolbar header */}
          <div className="hidden lg:flex items-center space-x-1 text-sm">
            <span className="font-medium text-gray-700">Tool bar</span>
            <svg
              className="w-3 h-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>

          {/* Left toolbar - Show on desktop or when mobile toolbar is expanded */}
          <div
            className={`${
              showMobileToolbar ? "flex" : "hidden"
            } lg:flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-2 w-full lg:w-auto`}
          >
            <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-2">
              {/* Hide Fields Dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setShowHideFieldsDropdown(!showHideFieldsDropdown)
                  }
                  className={`flex items-center space-x-1 px-2 py-1.5 lg:py-1 text-xs rounded transition-colors font-medium text-gray-700 w-full lg:w-auto justify-center lg:justify-start ${
                    hiddenFields.length > 0
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                  <span className="hidden sm:inline">Hide fields</span>
                  <span className="sm:hidden">Hide</span>
                  {hiddenFields.length > 0 && (
                    <span className="hidden sm:inline">
                      ({hiddenFields.length})
                    </span>
                  )}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showHideFieldsDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Column Visibility
                      </div>
                      {availableFields.map((field) => (
                        <label
                          key={field.key}
                          className="flex items-center space-x-2 py-1 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={!hiddenFields.includes(field.key)}
                            onChange={() =>
                              handleFieldVisibilityToggle(field.key)
                            }
                            className="rounded text-blue-600"
                          />
                          <span className="text-xs text-gray-700">
                            {field.label}
                          </span>
                          {!hiddenFields.includes(field.key) && (
                            <svg
                              className="w-3 h-3 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className={`flex items-center space-x-1 px-2 py-1.5 lg:py-1 text-xs rounded transition-colors font-medium text-gray-700 w-full lg:w-auto justify-center lg:justify-start ${
                    sortField !== null
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                    />
                  </svg>
                  <span className="hidden sm:inline">Sort</span>
                  <span className="sm:hidden">Sort</span>
                  {sortField && (
                    <span className="hidden sm:inline">({sortField})</span>
                  )}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Sort by
                      </div>
                      {sortOptions.map((option) => (
                        <button
                          key={option.key || "none"}
                          onClick={() => handleSortSelect(option.key)}
                          className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 flex items-center justify-between ${
                            sortField === option.key
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{option.label}</span>
                          {sortField === option.key && option.key !== null && (
                            <span className="text-xs">
                              {sortOrder === "asc"
                                ? "↑"
                                : sortOrder === "desc"
                                ? "↓"
                                : ""}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    // Reset pending values when opening
                    if (!showFilterDropdown) {
                      setPendingFilterField(filterField);
                      setPendingFilterValue(filterValue);
                    }
                  }}
                  className={`flex items-center space-x-1 px-2 py-1.5 lg:py-1 text-xs rounded transition-colors font-medium text-gray-700 w-full lg:w-auto justify-center lg:justify-start ${
                    filterField !== null
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Filter</span>
                  <span className="sm:hidden">Filter</span>
                  {filterField && (
                    <span className="hidden sm:inline">({filterField})</span>
                  )}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showFilterDropdown && (
                  <div
                    className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]"
                    data-filter-dropdown
                  >
                    <div className="p-3">
                      <div className="text-xs font-medium text-gray-700 mb-3">
                        Filter by
                      </div>
                      {filterOptions.map((option) => (
                        <div key={option.key} className="mb-3">
                          <div className="text-xs text-gray-600 mb-1">
                            {option.label}
                          </div>
                          {option.type === "select" && option.options ? (
                            <select
                              value={
                                pendingFilterField === option.key
                                  ? pendingFilterValue
                                  : ""
                              }
                              onChange={(e) =>
                                handlePendingFilterChange(
                                  option.key,
                                  e.target.value
                                )
                              }
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All</option>
                              {option.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={option.type === "date" ? "date" : "text"}
                              value={
                                pendingFilterField === option.key
                                  ? pendingFilterValue
                                  : ""
                              }
                              onChange={(e) =>
                                handlePendingFilterChange(
                                  option.key,
                                  e.target.value
                                )
                              }
                              placeholder={`Filter by ${option.label.toLowerCase()}`}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}
                        </div>
                      ))}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <button
                          onClick={handleClearFilter}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Clear
                        </button>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleCancelFilter}
                            className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleApplyFilter}
                            className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cell View Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCellViewDropdown(!showCellViewDropdown)}
                  className={`flex items-center space-x-1 px-2 py-1.5 lg:py-1 text-xs rounded transition-colors font-medium text-gray-700 w-full lg:w-auto justify-center lg:justify-start ${
                    cellViewMode !== "normal"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Cell view</span>
                  <span className="sm:hidden">View</span>
                  <span className="hidden sm:inline">({cellViewMode})</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showCellViewDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        View Mode
                      </div>
                      {cellViewOptions.map((option) => (
                        <button
                          key={option.key}
                          onClick={() => handleCellViewSelect(option.key)}
                          className={`w-full text-left px-2 py-2 text-xs rounded hover:bg-gray-50 ${
                            cellViewMode === option.key
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "text-gray-700"
                          }`}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-gray-500">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Import, Export, Share, New Action - Show on desktop or when mobile toolbar is expanded */}
        <div
          className={`${
            showMobileToolbar ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-2 w-full lg:w-auto`}
        >
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-1 text-sm">
            <button
              onClick={() => handleImportExportShare("Import")}
              className="flex items-center justify-center lg:justify-start space-x-1 px-2 py-1.5 lg:py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded text-xs transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              <span>Import</span>
            </button>

            <button
              onClick={() => handleImportExportShare("Export")}
              className="flex items-center justify-center lg:justify-start space-x-1 px-2 py-1.5 lg:py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded text-xs transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Export</span>
            </button>

            <button
              onClick={() => handleImportExportShare("Share")}
              className="flex items-center justify-center lg:justify-start space-x-1 px-2 py-1.5 lg:py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded text-xs transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              <span>Share</span>
            </button>

            <button
              onClick={handleNewAction}
              className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors col-span-2 lg:col-span-1"
            >
              <span>+ New Action</span>
            </button>
          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {(showHideFieldsDropdown ||
        showSortDropdown ||
        showCellViewDropdown ||
        showNotifications ||
        showSpreadsheetMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowHideFieldsDropdown(false);
            setShowSortDropdown(false);
            setShowCellViewDropdown(false);
            setShowNotifications(false);
            setShowSpreadsheetMenu(false);
          }}
        />
      )}

      {/* Separate click outside handler for filter dropdown that doesn't auto-close */}
      {showFilterDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            // Only close if clicking outside the dropdown itself
            const target = e.target as HTMLElement;
            if (!target.closest("[data-filter-dropdown]")) {
              handleCancelFilter();
            }
          }}
        />
      )}
    </div>
  );
}
