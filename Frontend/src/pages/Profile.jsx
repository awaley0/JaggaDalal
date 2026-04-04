import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateUserProfile as updateUserProfileApi } from "../api/auth";

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
    });
    setProfileImagePreview(user.profileImage || "");
    setSelectedProfileImage(null);
  }, [user, isEditing]);

  const initials = useMemo(() => {
    const name = user?.name || "User";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("") || "U"
    );
  }, [user?.name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("phone", formData.phone);
      payload.append("bio", formData.bio);

      if (selectedProfileImage) {
        payload.append("profileImage", selectedProfileImage);
      }

      const response = await updateUserProfileApi(payload);
      if (response?.data?.success && response?.data?.user) {
        updateUser(response.data.user);
        setSuccessMessage("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage(
        error.response?.data?.msg ||
          error.response?.data?.error ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage("");
    setSuccessMessage("");
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account and personal information</p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-linear-to-r from-slate-900 to-slate-800 px-6 sm:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  )}
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

          <div className="px-6 sm:px-8 py-8">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center">
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-slate-700">{initials}</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500 file:text-white file:font-semibold hover:file:bg-amber-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
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
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full px-6 py-3 border border-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-linear-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
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
