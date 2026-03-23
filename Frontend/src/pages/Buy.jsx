import PropertyCard from "../components/PropertyCard";
import properties from "../data/properties";

const Buy = () => {
  return (
    <div className="p-10 grid md:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};

export default Buy;