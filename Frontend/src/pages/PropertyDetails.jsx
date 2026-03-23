import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import properties from "../data/properties";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    const foundProperty = properties.find((p) => p.id === parseInt(id));
    if (foundProperty) {
      setProperty(foundProperty);
    } else {
      navigate("/");
    }
  }, [id, navigate]);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // TODO: Send contact form to backend
    alert("Thank you! The property agent will contact you soon.");
    setContactForm({ name: "", email: "", phone: "", message: "" });
    setShowContactForm(false);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Save to backend
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

  const similarProperties = properties
    .filter((p) => p.id !== property.id && p.type === property.type)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-blue-600 hover:text-blue-700">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              to={property.type === "buy" ? "/buy" : "/rent"}
              className="text-blue-600 hover:text-blue-700"
            >
              {property.type === "buy" ? "Buy" : "Rent"}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">{property.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images and Details */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="relative bg-gray-300 rounded-lg overflow-hidden mb-4 h-96">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={toggleFavorite}
                className={`absolute top-4 right-4 p-3 rounded-full transition-all ${
                  isFavorite
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-600 hover:text-red-600"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>

              {/* Type Badge */}
              {property.featured && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Featured
                </span>
              )}
            </div>

            {/* Gallery Thumbnails */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[property.image, property.image, property.image, property.image].map(
                (img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? "border-blue-600"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.title}
              </h1>
              <p className="text-gray-600 text-lg mb-4">{property.location}</p>

              {/* Price Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-blue-600">
                    ${property.price.toLocaleString()}
                  </span>
                  {property.pricePerMonth && (
                    <span className="text-gray-600">
                      / ${property.pricePerMonth.toLocaleString()} per month
                    </span>
                  )}
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {property.bedrooms}
                  </div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {property.bathrooms}
                  </div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {property.area.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Sq Ft</div>
                </div>
              </div>

              {/* Rating and Reviews */}
              <div className="mb-6 pb-6 border-b border-gray-200">
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
                  <span className="text-sm text-gray-600">
                    {property.rating.toFixed(1)} out of 5 ({property.reviews} reviews)
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
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg"
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
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Card */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20">
              {/* Agent Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">JD</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      JaggaDalal Agent
                    </h3>
                    <p className="text-sm text-gray-600">Property Agent</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  Experienced agent specializing in residential and commercial
                  properties.
                </p>
              </div>

              {/* Contact Buttons */}
              <div className="space-y-3 mb-6">
                <a
                  href="tel:+1234567890"
                  className="block w-full py-2.5 text-center bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Call Agent
                </a>
                <a
                  href="mailto:agent@example.com"
                  className="block w-full py-2.5 text-center border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all"
                >
                  Email Agent
                </a>
                <button
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="block w-full py-2.5 text-center bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                  Send Message
                </button>
              </div>

              {/* Contact Form */}
              {showContactForm && (
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
                    className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Send Message
                  </button>
                </form>
              )}

              {/* Quick Info */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Property ID:</span>{" "}
                  {property.id.toString().padStart(6, "0")}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Type:</span>{" "}
                  {property.type === "buy" ? "For Sale" : "For Rent"}
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
                      ${prop.price.toLocaleString()}
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
      </div>
    </div>
  );
};

export default PropertyDetails;