const ManageProperties = () => {
  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Manage Properties
      </h1>

      <table className="w-full bg-white shadow rounded-lg">

        <thead className="bg-gray-200">
          <tr>
            <th className="p-3">Title</th>
            <th className="p-3">Location</th>
            <th className="p-3">Price</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>

          <tr className="text-center border-t">
            <td className="p-3">Luxury Villa</td>
            <td className="p-3">London</td>
            <td className="p-3">$850,000</td>
            <td className="p-3">

              <button className="bg-green-500 text-white px-3 py-1 rounded mr-2">
                Approve
              </button>

              <button className="bg-red-500 text-white px-3 py-1 rounded">
                Delete
              </button>

            </td>
          </tr>

        </tbody>

      </table>

    </div>
  );
};

export default ManageProperties;