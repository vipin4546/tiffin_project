import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = () => {
  const { user, logout, isAdmin, isChef, isCustomer } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setIsOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const menuItems = [
    { label: "Profile", path: "/profile", show: true },
    {
      label: "Customer Dashboard",
      path: "/customer/dashboard",
      show: isCustomer,
    },
    { label: "Chef Dashboard", path: "/chef/dashboard", show: isChef },
    { label: "Admin Dashboard", path: "/admin/dashboard", show: isAdmin },
    { type: "divider", show: true },
    { label: "Logout", action: handleLogout, show: true },
  ].filter((item) => item.show);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
      >
        <img
          src={user?.profileImage || "/default-avatar.png"}
          alt="Profile"
          className="w-8 h-8 rounded-full border-2 border-green-500"
        />
        <span className="hidden md:block font-medium">{user?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            {user?.chefProfile && (
              <p className="text-xs text-gray-500">
                {user.chefProfile.status === "approved"
                  ? "✅ Approved Chef"
                  : "⏳ Pending Approval"}
              </p>
            )}
          </div>

          {menuItems.map((item, index) =>
            item.type === "divider" ? (
              <div key={index} className="border-t border-gray-100 my-1" />
            ) : (
              <button
                key={index}
                onClick={
                  item.action ? item.action : () => handleNavigation(item.path)
                }
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
