import { useEffect, useState } from "react";

export default function DesignList({ userId }) {
  const [designs, setDesigns] = useState([]);

  useEffect(() => {
    fetch(`/api/designs/${userId}`)
      .then(res => res.json())
      .then(setDesigns)
      .catch(err => console.error("Fetch designs error:", err));
  }, [userId]);

  if (!designs.length) return <p>No designs yet. Start customizing!</p>;

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {designs.map(d => (
        <div key={d.id} className="rounded-lg shadow-md p-3 bg-white">
          {d.thumbnailUrl ? (
            <img src={d.thumbnailUrl} alt={d.title} className="w-full h-40 object-cover rounded" />
          ) : (
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
              No Thumbnail
            </div>
          )}
          <h3 className="mt-2 text-lg font-semibold">{d.title}</h3>
          <p className="text-sm text-gray-500">Created: {new Date(d.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
