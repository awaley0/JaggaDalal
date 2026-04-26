import { useState, useEffect, useRef } from "react";
import axios from "../api/axios";
import LocationPicker from "./LocationPicker/LocationPicker";

const MAX_IMAGES = 5;
const MAX_PANORAMA_IMAGES = 6;

const PropertyFormModal = ({ isOpen, onClose, onPropertyAdded, editingProperty }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
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

  const [locationData, setLocationData] = useState({
    latitude: 28.7041,
    longitude: 77.1025,
    address: "New Delhi, India",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const imageInputRef = useRef(null);
  
  // Panorama image states
  const [selectedPanoramaImages, setSelectedPanoramaImages] = useState([]);
  const [panoramaPreview, setPanoramaPreview] = useState([]);
  const [panoramaLabels, setPanoramaLabels] = useState({});
  const panoramaInputRef = useRef(null);

  useEffect(() => {
    if (editingProperty) {
      setFormData({
        title: editingProperty.title || "",
        description: editingProperty.description || "",
        price: editingProperty.price || "",
        location: editingProperty.location || "",
        propertyType: editingProperty.propertyType || "",
        bedrooms: editingProperty.bedrooms || "",
        bathrooms: editingProperty.bathrooms || "",
        squareFeet: editingProperty.squareFeet || "",
        listingType: editingProperty.listingType || "sell",
        status: editingProperty.status || "available",
      });
      if (editingProperty.address) {
        setLocationData({
          latitude: editingProperty.address.coordinates?.latitude || 28.7041,
          longitude: editingProperty.address.coordinates?.longitude || 77.1025,
          address: editingProperty.address.street || editingProperty.location,
          city: editingProperty.address.city || "",
          state: editingProperty.address.state || "",
          postalCode: editingProperty.address.postalCode || "",
          country: editingProperty.address.country || "India",
        });
      }
      setImagePreview(editingProperty.images || []);
    } else {
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
    }
    setError("");
  }, [editingProperty, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const availableSlots = Math.max(MAX_IMAGES - imagePreview.length, 0);
    const acceptedFiles = files.slice(0, availableSlots);

    if (!acceptedFiles.length) {
      setError(`You can upload up to ${MAX_IMAGES} images only.`);
      e.target.value = "";
      return;
    }

    setSelectedImages((prev) => [...prev, ...acceptedFiles]);

    const previews = acceptedFiles.map((file) => URL.createObjectURL(file));
    setImagePreview((prev) => [...prev, ...previews]);

    if (files.length > acceptedFiles.length) {
      setError(`Only ${MAX_IMAGES} images are allowed. Extra files were skipped.`);
    } else {
      setError("");
    }

    // Allow selecting the same file again after removing.
    e.target.value = "";
  };

  const handleOpenImagePicker = () => {
    imageInputRef.current?.click();
  };

  const handleOpenPanoramaPicker = () => {
    panoramaInputRef.current?.click();
  };

  const handlePanoramaImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const availableSlots = Math.max(MAX_PANORAMA_IMAGES - panoramaPreview.length, 0);
    const acceptedFiles = files.slice(0, availableSlots);

    if (!acceptedFiles.length) {
      setError(`You can upload up to ${MAX_PANORAMA_IMAGES} panorama images only.`);
      e.target.value = "";
      return;
    }

    setSelectedPanoramaImages((prev) => [...prev, ...acceptedFiles]);

    const previews = acceptedFiles.map((file) => URL.createObjectURL(file));
    setPanoramaPreview((prev) => [...prev, ...previews]);

    if (files.length > acceptedFiles.length) {
      setError(`Only ${MAX_PANORAMA_IMAGES} panorama images are allowed. Extra files were skipped.`);
    } else {
      setError("");
    }

    e.target.value = "";
  };

  const removePanoramaImage = (index) => {
    const isExistingImage = typeof panoramaPreview[index] === "string" && panoramaPreview[index].startsWith("http");
    
    if (!isExistingImage) {
      const existingImagesCount = panoramaPreview.filter(p => typeof p === "string" && p.startsWith("http")).length;
      const fileIndex = index - existingImagesCount;
      const newImages = selectedPanoramaImages.filter((_, i) => i !== fileIndex);
      setSelectedPanoramaImages(newImages);
    }
    
    const newPreviews = panoramaPreview.filter((_, i) => i !== index);
    setPanoramaPreview(newPreviews);
    
    // Remove label for this image
    const newLabels = { ...panoramaLabels };
    delete newLabels[index];
    setPanoramaLabels(newLabels);
  };

  const setPanoramaLabel = (index, label) => {
    setPanoramaLabels((prev) => ({
      ...prev,
      [index]: label,
    }));
  };

  const removeImage = (index) => {
    // If it's a new file (doesn't start with http), remove from selectedImages
    const isExistingImage = typeof imagePreview[index] === "string" && imagePreview[index].startsWith("http");
    
    if (!isExistingImage) {
      // Find the relative index in selectedImages
      const existingImagesCount = imagePreview.filter(p => typeof p === "string" && p.startsWith("http")).length;
      const fileIndex = index - existingImagesCount;
      const newImages = selectedImages.filter((_, i) => i !== fileIndex);
      setSelectedImages(newImages);
    }
    
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError("Property title is required");
        setLoading(false);
        return;
      }
      if (!formData.description.trim()) {
        setError("Property description is required");
        setLoading(false);
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError("Valid property price is required");
        setLoading(false);
        return;
      }
      if (!formData.propertyType) {
        setError("Property type is required");
        setLoading(false);
        return;
      }
      if (!formData.listingType) {
        setError("Listing type (sell/rent) is required");
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("price", parseFloat(formData.price));
      formDataToSend.append("location", locationData.address || formData.location);
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
      
      // Add new images
      selectedImages.forEach((image) => {
        formDataToSend.append("images", image);
      });

      // Add panorama images with labels
      selectedPanoramaImages.forEach((image, index) => {
        formDataToSend.append("panoramaImages", image);
        const label = panoramaLabels[index] || `Room ${index + 1}`;
        formDataToSend.append("panoramaLabels", label);
      });

      let response;
      if (editingProperty) {
        response = await axios.put(`/properties/${editingProperty._id}`, formDataToSend);
      } else {
        response = await axios.post("/properties", formDataToSend);
      }

      if (response.data?.success || response.status === 201) {
        if (onPropertyAdded) {
          onPropertyAdded(response.data.data || response.data);
        }
        onClose();
      } else {
        setError(response.data?.message || response.data?.error || "Failed to save property");
      }
    } catch (err) {
      console.error("Error saving property:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to save property";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100 p-4 text-left">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {editingProperty ? "Edit Property" : "Add New Property"}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

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
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="townhouse">Townhouse</option>
                <option value="condo">Condo</option>
              </select>

              <select
                name="listingType"
                value={formData.listingType}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sell">For Sale</option>
                <option value="rent">For Rent</option>
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
              required
              rows="3"
              className="w-full col-span-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            {/* Image Upload */}
            <div className="col-span-2 text-left">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Images (Up to {MAX_IMAGES})
              </label>

              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenImagePicker}
                  disabled={imagePreview.length >= MAX_IMAGES}
                  className="px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Choose Files
                </button>

                {imagePreview.length > 0 && imagePreview.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={handleOpenImagePicker}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Add More
                  </button>
                )}

                <span className="text-sm text-gray-600">
                  {imagePreview.length}/{MAX_IMAGES} selected
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1">Supported: JPEG, PNG, WebP, GIF (Max 5MB each)</p>
            </div>

            {/* Image Preview */}
            {imagePreview.length > 0 && (
              <div className="col-span-2 text-left">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Images ({imagePreview.length})
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

            {/* 360° Panorama Images Upload */}
            <div className="col-span-2 text-left border-t pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔄 360° Panorama Images (Up to {MAX_PANORAMA_IMAGES})
              </label>

              <input
                ref={panoramaInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePanoramaImageChange}
                className="hidden"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenPanoramaPicker}
                  disabled={panoramaPreview.length >= MAX_PANORAMA_IMAGES}
                  className="px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Panorama Images
                </button>

                <span className="text-sm text-gray-600">
                  {panoramaPreview.length}/{MAX_PANORAMA_IMAGES} selected
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1">Upload high-quality equirectangular panoramic images for 360° view</p>
            </div>

            {/* Panorama Preview */}
            {panoramaPreview.length > 0 && (
              <div className="col-span-2 text-left">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Panorama Images ({panoramaPreview.length})
                </p>
                <div className="space-y-3">
                  {panoramaPreview.map((preview, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                      <img
                        src={preview}
                        alt={`Panorama ${index}`}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <input
                          type="text"
                          placeholder={`Room name (e.g., Living Room, Kitchen)`}
                          value={panoramaLabels[index] || ""}
                          onChange={(e) => setPanoramaLabel(index, e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePanoramaImage(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
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
  );
};

export default PropertyFormModal;
