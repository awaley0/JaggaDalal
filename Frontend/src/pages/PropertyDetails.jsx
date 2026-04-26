import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import properties from "../data/properties"; // Fallback static data
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { getPropertyById } from "../api/propertyApi";
import { sendMessageToAdmin } from "../api/chatApi";
import PropertyDetailsMap from "../components/Map/PropertyDetailsMap";
import { addFavorite, removeFavorite, isFavorited } from "../api/favoriteApi";
import { formatRs } from "../utils/currency";
import PropertyDetailsMediaSection from "../components/3D/PropertyDetailsMediaSection";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [adminMessageLoading, setAdminMessageLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [fallbackPayLoading, setFallbackPayLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingForm, setBookingForm] = useState({
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: "",
    numberOfRooms: "",
    notes: "",
  });
  const [esewaPayload, setEsewaPayload] = useState(null); // eSewa payload after booking created
  const [createdBooking, setCreatedBooking] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    sellerName: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // Try to fetch from API first
        const response = await getPropertyById(id);
        if (response.success && response.data) {
          setProperty(response.data);
          
          // Check if property is favorited
          if (isAuthenticated) {
            try {
              const favorited = await isFavorited(response.data._id);
              setIsFavorite(favorited);
            } catch (err) {
              console.error("Error checking favorite status:", err);
            }
          }
        } else {
          // Fallback to static data
          const foundProperty = properties.find((p) => p.id === parseInt(id));
          if (foundProperty) {
            setProperty(foundProperty);
          } else {
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        // Fallback to static data if API fails
        const foundProperty = properties.find((p) => p.id === parseInt(id));
        if (foundProperty) {
          setProperty(foundProperty);
        } else {
          navigate("/");
        }
      }
    };

    fetchProperty();
  }, [id, navigate]);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    setContactForm((prev) => ({
      ...prev,
      name: user?.name || prev.name || "",
      sellerName: property?.seller?.name || prev.sellerName || "",
      email: user?.email || prev.email || "",
      phone: user?.phone || prev.phone || "",
    }));
  }, [user, property?.seller?.name]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Please log in to contact the seller.");
      navigate("/login");
      return;
    }

    const sellerId = property?.seller?._id;
    if (!sellerId) {
      alert("Seller information is unavailable for this property.");
      return;
    }

    try {
      setContactLoading(true);
      const inquiryMessage = [
        `Property inquiry for \"${property.title}\"`,
        `Buyer: ${contactForm.name}`,
        `Seller: ${contactForm.sellerName || sellerName}`,
        contactForm.message,
        `Contact: ${contactForm.name} | ${contactForm.email}${contactForm.phone ? ` | ${contactForm.phone}` : ''}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      await axiosInstance.post("/chat/send", {
        receiverId: sellerId,
        propertyId: property._id || property.id,
        message: inquiryMessage,
        messageType: "text",
      });

      alert("Your message has been sent. Opening live chat now.");
      setContactForm((prev) => ({
        ...prev,
        message: "",
      }));
      setShowContactForm(false);
      navigate(`/chat?recipientId=${encodeURIComponent(sellerId)}&recipientName=${encodeURIComponent(sellerName)}&propertyId=${encodeURIComponent(property._id || property.id)}`);
    } catch (error) {
      console.error("Contact inquiry error:", error);
      alert(error.response?.data?.error || "Failed to send your inquiry. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleAdminMessage = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const propertyId = property?._id || property?.id;
    if (!propertyId) {
      alert("Property information is unavailable. Please refresh and try again.");
      return;
    }

    try {
      setAdminMessageLoading(true);

      const buyerName = user?.name || "Buyer";
      const adminInquiryMessage = [
        `Hello Admin, I am interested in \"${property.title}\".`,
        `Buyer: ${buyerName}`,
      ].join("\n\n");

      const response = await sendMessageToAdmin(propertyId, adminInquiryMessage);

      if (!response?.success || !response?.recipient?.id) {
        throw new Error("Unable to open admin chat right now.");
      }

      navigate(
        `/chat?recipientId=${encodeURIComponent(response.recipient.id)}&recipientName=${encodeURIComponent(
          response.recipient.name || "Admin"
        )}&propertyId=${encodeURIComponent(propertyId)}`
      );
    } catch (error) {
      console.error("Admin message error:", error);
      alert(error?.error || error?.message || "Failed to message admin. Please try again.");
    } finally {
      setAdminMessageLoading(false);
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const payload = {
        propertyId: property._id || property.id,
        checkInDate: bookingForm.checkInDate || undefined,
        checkOutDate: bookingForm.checkOutDate || undefined,
        numberOfGuests: bookingForm.numberOfGuests ? parseInt(bookingForm.numberOfGuests) : undefined,
        numberOfRooms: bookingForm.numberOfRooms ? parseInt(bookingForm.numberOfRooms) : undefined,
        notes: bookingForm.notes,
      };

      const response = await axiosInstance.post("/bookings", payload);

      if (response.data.success) {
        // Store the booking + eSewa payload so we can show the payment step
        setCreatedBooking(response.data.data.booking);
        setEsewaPayload(response.data.data.esewaPayload);
      }
    } catch (error) {
      const message = error.response?.data?.error || "Failed to create booking. Please try again.";
      setBookingError(message);
      console.error("Booking error:", error);
    } finally {
      setBookingLoading(false);
    }
  };

  // Auto-submit the hidden eSewa form to redirect user to payment gateway
  const handlePayWithEsewa = () => {
    const form = document.getElementById("esewa-payment-form");
    if (form) form.submit();
  };

  const handleSandboxFallbackConfirm = async () => {
    if (!createdBooking?._id) return;

    try {
      setFallbackPayLoading(true);
      setBookingError("");
      const res = await axiosInstance.post(`/bookings/payment/mock-confirm/${createdBooking._id}`);

      if (res.data?.success) {
        alert("Payment confirmed in sandbox fallback mode.");
        navigate(`/payment/verify?mock=1&bookingId=${createdBooking._id}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || "Fallback payment confirmation failed.";
      setBookingError(message);
    } finally {
      setFallbackPayLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      alert("Please log in to add favorites!");
      return;
    }

    setFavLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        await removeFavorite(property._id || id);
        setIsFavorite(false);
      } else {
        // Add to favorites
        await addFavorite(property._id || id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorite. Please try again.");
    } finally {
      setFavLoading(false);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Property not found</p>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const listingType = (property.listingType || property.type || "").toLowerCase();
  const isRent = listingType === "rent";
  const propertyStatus = String(property.status || "available").toLowerCase();
  const isAvailable = propertyStatus === "available";
  const availabilityLabel =
    propertyStatus === "sold"
      ? "Sold"
      : propertyStatus === "rented"
      ? "Rented"
      : propertyStatus === "inactive"
      ? "Inactive"
      : "Available";
  const normalizedAreaValue =
    typeof property.area === "object" ? property.area?.value : property.area;
  const normalizedAreaUnit =
    typeof property.area === "object" && property.area?.unit
      ? property.area.unit
      : "sqft";
  const areaDisplay = Number.isFinite(Number(normalizedAreaValue))
    ? Number(normalizedAreaValue).toLocaleString()
    : "N/A";
  const areaUnitLabel = normalizedAreaUnit === "sqm" ? "sqm" : "sq ft";
  const bedroomsDisplay = Number.isFinite(Number(property.bedrooms))
    ? Number(property.bedrooms)
    : 0;
  const bathroomsDisplay = Number.isFinite(Number(property.bathrooms))
    ? Number(property.bathrooms)
    : 0;

  const sellerName = property?.seller?.name || "Seller";
  const sellerId = property?.seller?._id || property?.seller?.id;
  const sellerEmail = property?.seller?.email || "";
  const sellerPhone = property?.seller?.phone || "";
  const sellerInitials = sellerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SL";
  const pricePerUnit =
    Number.isFinite(Number(normalizedAreaValue)) && Number(normalizedAreaValue) > 0
      ? Math.round(Number(property.price || 0) / Number(normalizedAreaValue))
      : null;
  const publishedDate = property?.createdAt
    ? new Date(property.createdAt).toLocaleDateString()
    : "Recently listed";
  const currentUserId = user?.id || user?._id;
  const isSellerUser = user?.role === "seller" || user?.role === "admin";
  const isOwnerViewingListing =
    Boolean(isSellerUser && currentUserId && sellerId) &&
    String(currentUserId) === String(sellerId);
  const shouldShowBuyerActions = !isAuthenticated || user?.role === "buyer";

  const similarProperties = properties
    .filter((p) => p.id !== property.id && p.type === property.type)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100">
      {/* Breadcrumb */}
      <div className="bg-white/95 border-b border-slate-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-blue-600 hover:text-blue-700">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              to={isRent ? "/rent" : "/buy"}
              className="text-blue-600 hover:text-blue-700"
            >
              {isRent ? "Rent" : "Buy"}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">{property.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Images and Details */}
          <div className="lg:col-span-2">
            {/* Media Gallery with 360° View Support */}
            <div className="mb-6">
              <PropertyDetailsMediaSection property={property} />
            </div>

            {/* Add Favorite Button */}
            <div className="mb-6">
              <button
                onClick={toggleFavorite}
                disabled={favLoading}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFavorite
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white border-2 border-red-300 text-red-600 hover:bg-red-50"
                }`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <svg
                  className={`w-5 h-5`}
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={isFavorite ? 0 : 2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </button>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-7 mb-6 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.title}
              </h1>
              <p className="text-gray-600 text-lg mb-4">{property.location}</p>

              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                  {isRent ? "For Rent" : "For Sale"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isAvailable
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {availabilityLabel}
                </span>
                {property.verified && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    Verified Listing
                  </span>
                )}
                {isOwnerViewingListing && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    Owner View
                  </span>
                )}
              </div>

              {isOwnerViewingListing && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  You are viewing this listing as the owner. Buyer booking actions are hidden for seller mode.
                </div>
              )}

              {!isAvailable && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
                  This property is currently {availabilityLabel.toLowerCase()} and cannot be booked right now.
                </div>
              )}

              {/* Price Info */}
              <div className="mb-7 pb-7 border-b border-slate-200">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-blue-600 tracking-tight">
                    {formatRs(property.price)}
                  </span>
                  {property.pricePerMonth && (
                    <span className="text-slate-600 font-medium">
                      / {formatRs(property.pricePerMonth)} per month
                    </span>
                  )}
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7 pb-7 border-b border-slate-200">
                <div className="text-center bg-slate-50 rounded-xl py-4 border border-slate-100">
                  <div className="text-2xl font-bold text-slate-900">
                    {bedroomsDisplay}
                  </div>
                  <div className="text-sm text-slate-600">Bedrooms</div>
                </div>
                <div className="text-center bg-slate-50 rounded-xl py-4 border border-slate-100">
                  <div className="text-2xl font-bold text-slate-900">
                    {bathroomsDisplay}
                  </div>
                  <div className="text-sm text-slate-600">Bathrooms</div>
                </div>
                <div className="text-center bg-slate-50 rounded-xl py-4 border border-slate-100">
                  <div className="text-2xl font-bold text-slate-900">
                    {areaDisplay}
                  </div>
                  <div className="text-sm text-slate-600">{areaUnitLabel}</div>
                </div>
              </div>

              {/* Rating and Reviews */}
              <div className="mb-7 pb-7 border-b border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(property.rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">
                    {Number(property.rating || 0).toFixed(1)} out of 5 ({Number(property.reviews || 0)} reviews)
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(property.amenities || []).length > 0 ? (property.amenities || []).map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"
                    >
                      <svg
                        className="w-5 h-5 text-blue-600"
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
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 col-span-full">No amenities provided for this property yet.</p>
                  )}
                </div>
              </div>

              {/* Location Map */}
              {property.address?.coordinates && (
                <div className="mt-8">
                  <PropertyDetailsMap
                    latitude={property.address.coordinates.latitude}
                    longitude={property.address.coordinates.longitude}
                    address={property.location || property.address?.street}
                    propertyTitle={property.title}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Contact Card */}
          <div>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sticky top-20 shadow-lg">
              {/* Agent Info */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <div className="rounded-2xl bg-linear-to-r from-slate-50 to-blue-50 border border-slate-200 p-4">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-14 h-14 bg-blue-100 rounded-full ring-4 ring-white shadow-sm flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">{sellerInitials}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl">{sellerName}</h3>
                      <p className="text-sm text-slate-600">Verified Listing Advisor</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Reach the seller directly for pricing details, availability, negotiation, and booking support.
                  </p>
                </div>
              </div>

              {/* Contact/Booking Buttons */}
              <div className="space-y-3 mb-6">
                {shouldShowBuyerActions ? (
                  <>
                    {/* Booking Button - For Rentals */}
                    {listingType === "rent" && (
                      <button
                        onClick={() => {
                          if (!isAvailable) return;
                          if (!isAuthenticated) {
                            navigate("/login");
                          } else {
                            setShowBookingModal(true);
                          }
                        }}
                        disabled={!isAvailable}
                        className="block w-full py-3 text-center bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isAvailable ? "Schedule Booking" : `Unavailable (${availabilityLabel})`}
                      </button>
                    )}

                    {/* Purchase/Inquiry Button - For Sales */}
                    {listingType === "sell" && (
                      <button
                        onClick={() => {
                          if (!isAvailable) return;
                          if (!isAuthenticated) {
                            navigate("/login");
                          } else {
                            setShowContactForm(true);
                          }
                        }}
                        disabled={!isAvailable}
                        className="block w-full py-3 text-center bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isAvailable ? "Inquire Now" : `Unavailable (${availabilityLabel})`}
                      </button>
                    )}

                    {sellerPhone ? (
                      <a
                        href={`tel:${sellerPhone}`}
                        className="block w-full py-3 text-center bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                      >
                        Call Seller
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="block w-full py-3 text-center bg-gray-300 text-white font-semibold rounded-xl cursor-not-allowed"
                      >
                        Call Seller (Unavailable)
                      </button>
                    )}

                    {sellerEmail ? (
                      <a
                        href={`mailto:${sellerEmail}`}
                        className="block w-full py-3 text-center border border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
                      >
                        Email Seller
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="block w-full py-3 text-center border border-gray-300 text-gray-500 font-semibold rounded-xl cursor-not-allowed"
                      >
                        Email Seller (Unavailable)
                      </button>
                    )}

                    {/* Send message to admin */}
                    <button
                      onClick={handleAdminMessage}
                      disabled={adminMessageLoading}
                      className="block w-full py-3 text-center bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {adminMessageLoading ? "Sending..." : "Send Message"}
                    </button>
                  </>
                ) : (
                  <>
                    {isOwnerViewingListing ? (
                      <>
                        <button
                          onClick={() => navigate('/admin/properties')}
                          className="block w-full py-2.5 text-center bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
                        >
                          ✏️ Manage This Listing
                        </button>
                        <button
                          onClick={() => navigate('/admin/bookings')}
                          className="block w-full py-2.5 text-center bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all"
                        >
                          📋 View Booking Requests
                        </button>
                        <button
                          onClick={() => navigate('/chat')}
                          className="block w-full py-2.5 text-center border border-indigo-600 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all"
                        >
                          💬 Open Buyer Chats
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate('/chat')}
                          className="block w-full py-2.5 text-center bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
                        >
                          💬 Message Listing Owner
                        </button>
                        <button
                          onClick={() => navigate('/admin/properties')}
                          className="block w-full py-2.5 text-center border border-indigo-600 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all"
                        >
                          📊 Back to My Listings
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Contact Form */}
              {showContactForm && shouldShowBuyerActions && (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                  <input
                    type="text"
                    name="sellerName"
                    placeholder="Seller Name"
                    value={contactForm.sellerName}
                    onChange={handleContactChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Your Phone"
                    value={contactForm.phone}
                    onChange={handleContactChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                    required
                  ></textarea>
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-60"
                  >
                    {contactLoading ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}

              {/* Quick Info */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Property ID:</span>{" "}
                  {(property._id || property.id || "N/A").toString().slice(-6)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Type:</span>{" "}
                  {isRent ? "For Rent" : "For Sale"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Published:</span> {publishedDate}
                </p>
                {property.verified && (
                  <p className="text-sm text-green-700 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-2.77 3.066 3.066 0 00-3.58 3.003A5.991 5.991 0 1017.5 7A5.991 5.991 0 015 11.25a3.066 3.066 0 001.267-2.795zm0 0H5.5"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Verified Property</span>
                  </p>
                )}
              </div>

              {shouldShowBuyerActions && (
                <div className="mt-4 bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Buyer Insights</h4>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Area:</span> {areaDisplay} {areaUnitLabel}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Price per {areaUnitLabel}:</span>{" "}
                    {pricePerUnit ? formatRs(pricePerUnit) : "N/A"}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Bedrooms / Bathrooms:</span> {bedroomsDisplay} / {bathroomsDisplay}
                  </p>
                  <p className="text-xs text-slate-500 pt-1 border-t border-slate-200">
                    Tip: compare this listing with nearby properties and book a chat to negotiate faster.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Similar Properties
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((prop) => (
                <Link
                  key={prop.id}
                  to={`/property/${prop.id}`}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gray-300">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    {prop.featured && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{prop.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{prop.location}</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatRs(prop.price)}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                      <span>{prop.bedrooms} bed</span>
                      <span>{prop.bathrooms} bath</span>
                      <span>{prop.area} sqft</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => {
              setShowBookingModal(false);
              setBookingError("");
              setEsewaPayload(null);
            }}
          >
            <div 
              className="bg-white rounded-lg max-w-2xl w-full p-6 my-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-4 border-b">
                <h2 className="text-2xl font-bold text-gray-900">📋 Book Property</h2>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingError("");
                    setEsewaPayload(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition"
                >
                  ✕
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Complete your booking for <span className="font-semibold text-blue-600">{property.title}</span>
              </p>

              {bookingError && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-semibold">⚠️ {bookingError}</p>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {/* User Details Section */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Your Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={user?.name || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={user?.phone || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                    <p className="font-semibold text-gray-900">{property.title}</p>
                    <p className="text-sm text-gray-600">{property.location}</p>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>

                  {/* For Rentals - Check-in and Check-out Dates */}
                  {property.listingType === "rent" && (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-in Date
                          </label>
                          <input
                            type="date"
                            name="checkInDate"
                            value={bookingForm.checkInDate}
                            onChange={handleBookingChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-out Date
                          </label>
                          <input
                            type="date"
                            name="checkOutDate"
                            value={bookingForm.checkOutDate}
                            onChange={handleBookingChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Guests
                          </label>
                          <input
                            type="number"
                            name="numberOfGuests"
                            min="1"
                            value={bookingForm.numberOfGuests}
                            onChange={handleBookingChange}
                            placeholder="e.g., 2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Rooms
                          </label>
                          <input
                            type="number"
                            name="numberOfRooms"
                            min="1"
                            value={bookingForm.numberOfRooms}
                            onChange={handleBookingChange}
                            placeholder="e.g., 1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                          />
                        </div>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Monthly Rent:</span> {formatRs(property.price || 0)}
                        </p>
                      </div>
                    </>
                  )}

                  {/* For Sales - Just show price */}
                  {property.listingType === "sell" && (
                    <div className="bg-green-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Price:</span> {formatRs(property.price || 0)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Any specific requirements or questions?"
                    value={bookingForm.notes}
                    onChange={handleBookingChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 resize-none"
                  ></textarea>
                </div>

                {/* Error Message */}
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{bookingError}</p>
                  </div>
                )}

                {/* Step 2: eSewa Payment — shown after booking is created */}
                {esewaPayload && (
                  <div className="mt-6 p-5 bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-green-800 text-lg">Booking Created!</p>
                        <p className="text-green-700 text-sm">Complete your payment to confirm.</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 mb-4 border border-green-200">
                      <p className="text-sm text-gray-600">Amount to Pay</p>
                      <p className="text-2xl font-bold text-gray-900">{formatRs(esewaPayload.total_amount)}</p>
                      <p className="text-xs text-gray-500 mt-1">Property: {property.title}</p>
                    </div>

                    {/* Hidden eSewa form that auto-submits to gateway */}
                    <form
                      id="esewa-payment-form"
                      action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
                      method="POST"
                      className="hidden"
                    >
                      {esewaPayload && Object.entries(esewaPayload).map(([key, val]) => (
                        <input key={key} type="hidden" name={key} value={val} />
                      ))}
                    </form>

                    <button
                      type="button"
                      onClick={handlePayWithEsewa}
                      className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      <img
                        src="https://esewa.com.np/common/images/esewa_logo.png"
                        alt="eSewa"
                        className="h-6 object-contain bg-white rounded px-1"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      Pay with eSewa
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      You will be redirected to eSewa secure payment gateway
                    </p>

                    {import.meta.env.DEV && createdBooking?._id && (
                      <button
                        type="button"
                        onClick={handleSandboxFallbackConfirm}
                        disabled={fallbackPayLoading}
                        className="w-full mt-3 py-2.5 border-2 border-amber-500 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all disabled:opacity-60"
                      >
                        {fallbackPayLoading ? "Processing..." : "Sandbox Down? Confirm Payment (Dev Fallback)"}
                      </button>
                    )}
                  </div>
                )}

                {/* Step 1: Confirm Booking Buttons */}
                {!esewaPayload && (
                  <div className="flex gap-3 pt-6 border-t mt-6 sticky bottom-0 bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingModal(false);
                        setBookingError("");
                      }}
                      className="flex-1 py-3 text-center border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-all text-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 py-3 text-center bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl"
                    >
                      {bookingLoading ? "⏳ Processing..." : "✓ Confirm Booking"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetails;