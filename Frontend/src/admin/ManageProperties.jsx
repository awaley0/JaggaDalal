import { useState, useEffect } from "react";
import { getAllPropertiesForAdmin, deletePropertyByAdmin, updatePropertyStatus } from "../api/adminApi";
import axios from "../api/axios";
import LocationPicker from "../components/LocationPicker/LocationPicker";

const ManageProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [locationData, setLocationData] = useState({
    latitude: 28.7041,
    longitude: 77.1025,
    address: "New Delhi, India",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    listingType: "sell",
    status: "available",
  });

  // Fetch properties
  useEffect(() => {
    fetchProperties();
  }, [page, search, statusFilter]);

  const fetchProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const filters = { page, limit: 10 };
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      
      const response = await getAllPropertiesForAdmin(filters);
      setProperties(response.data || []);
      setPagination(response.pagination);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);

    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", parseFloat(formData.price));
      formDataToSend.append("location", locationData.address);
      formDataToSend.append("address", locationData.address);
      formDataToSend.append("latitude", locationData.latitude);
      formDataToSend.append("longitude", locationData.longitude);
      formDataToSend.append("city", locationData.city);
      formDataToSend.append("state", locationData.state);
      formDataToSend.append("postalCode", locationData.postalCode);
      formDataToSend.append("country", locationData.country);
      formDataToSend.append("propertyType", formData.propertyType);
      formDataToSend.append("listingType", formData.listingType);
      formDataToSend.append("bedrooms", parseInt(formData.bedrooms) || 0);
      formDataToSend.append("bathrooms", parseInt(formData.bathrooms) || 0);
      formDataToSend.append("squareFeet", parseInt(formData.squareFeet) || 0);
      formDataToSend.append("status", formData.status);
      
      // Append images
      selectedImages.forEach((image) => {
        formDataToSend.append("images", image);
      });

      if (editingProperty) {
        // Update existing property
        await axios.put(`/properties/${editingProperty._id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccessMessage("Property updated successfully!");
      } else {
        // Create new property
        await axios.post("/properties", formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccessMessage("Property created successfully!");
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        location: "",
        propertyType: "",
        bedrooms: "",
        bathrooms: "",
        squareFeet: "",
        listingType: "sell",
        status: "available",
      });
      setLocationData({
        latitude: 28.7041,
        longitude: 77.1025,
        address: "New Delhi, India",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      });
      setSelectedImages([]);
      setImagePreview([]);
      setEditingProperty(null);
      setShowForm(false);

      // Refresh list
      fetchProperties();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error saving property:", err);
      setError(err.response?.data?.message || "Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title || "",
      description: property.description || "",
      price: property.price || "",
      location: property.location || "",
      propertyType: property.propertyType || "",
      bedrooms: property.bedrooms || "",
      bathrooms: property.bathrooms || "",
      squareFeet: property.squareFeet || "",
      listingType: property.listingType || "sell",
      status: property.status || "available",
    });
    setShowForm(true);
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;

    try {
      setLoading(true);
      await deletePropertyByAdmin(propertyId);
      setSuccessMessage("Property deleted successfully!");
      fetchProperties();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting property:", err);
      setError("Failed to delete property");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      await updatePropertyStatus(propertyId, newStatus);
      setSuccessMessage("Status updated successfully!");
      fetchProperties();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProperty(null);
    setFormData({
      title: "",
      description: "",
      price: "",
      location: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      listingType: "sell",
      status: "available",
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Properties</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          + Add New Property
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingProperty ? "Edit Property" : "Add New Property"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="title"
                    placeholder="Property Title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="col-span-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    required
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Property Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="villa">Villa</option>
                  </select>

                  <select
                    name="listingType"
                    value={formData.listingType}
                    onChange={handleInputChange}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sell">For Sale</option>
                    <option value="rent">For Rent</option>
                    <option value="buy">Buy</option>
                  </select>

                  <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <input
                    type="number"
                    name="bedrooms"
                    placeholder="Bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <input
                    type="number"
                    name="bathrooms"
                    placeholder="Bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <input
                    type="number"
                    name="squareFeet"
                    placeholder="Square Feet"
                    value={formData.squareFeet}
                    onChange={handleInputChange}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>

                {/* Location Picker */}
                <LocationPicker
                  onLocationChange={setLocationData}
                  initialLatitude={locationData.latitude}
                  initialLongitude={locationData.longitude}
                  initialAddress={locationData.address}
                />

                <textarea
                  name="description"
                  placeholder="Property Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full col-span-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                {/* Image Upload */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property Images (Up to 5)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supported: JPEG, PNG, WebP, GIF (Max 5MB each)</p>
                </div>

                {/* Image Preview */}
                {imagePreview.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Selected Images ({imagePreview.length})
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Property"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && page === 1 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No properties found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {properties.map((property) => (
                <tr key={property._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{property.title}</td>
                  <td className="px-6 py-4 text-sm">{property.location}</td>
                  <td className="px-6 py-4 text-sm font-semibold">${property.price?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm capitalize">{property.propertyType}</td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={property.status}
                      onChange={(e) => handleStatusChange(property._id, e.target.value)}
                      className="px-2 py-1 border rounded text-sm focus:outline-none"
                    >
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(property)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(property._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProperties;