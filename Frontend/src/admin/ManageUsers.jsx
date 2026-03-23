const ManageUsers = () => {
  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Manage Users
      </h1>

      <table className="w-full bg-white shadow rounded-lg">

        <thead className="bg-gray-200">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody>

          <tr className="text-center border-t">
            <td className="p-3">John Doe</td>
            <td className="p-3">john@email.com</td>
            <td className="p-3">User</td>

            <td className="p-3">
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

export default ManageUsers;