import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // In a real app, this would call an API to update the profile
      updateUser(formData);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account and personal information</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 sm:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <p className="text-slate-200 text-sm capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 sm:px-8 py-8">
            {isEditing ? (
              // Edit Form
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            ) : (
              // Display View
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Full Name</p>
                    <p className="text-slate-900 font-semibold">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Email</p>
                    <p className="text-slate-900 font-semibold">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Role</p>
                    <p className="text-slate-900 font-semibold capitalize">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Phone</p>
                    <p className="text-slate-900 font-semibold">{user.phone || "Not provided"}</p>
                  </div>
                </div>

                {user.bio && (
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Bio</p>
                    <p className="text-slate-900">{user.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="border-t border-slate-200 px-6 sm:px-8 py-8 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Danger Zone</h3>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
