import { useEffect, useState } from "react";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const empty = {
  name: "",
  age: "",
  phone: "",
  address: "",
  level: "Beginner",
  notes: "",
  image: "",
};

export default function TraineeForm({
  initialValues = empty,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  submitting = false,
}) {
  const [name, setName] = useState(initialValues.name ?? "");
  const [age, setAge] = useState(
    initialValues.age !== undefined && initialValues.age !== null
      ? String(initialValues.age)
      : ""
  );
  const [level, setLevel] = useState(initialValues.level ?? "Beginner");
  const [notes, setNotes] = useState(initialValues.notes ?? "");
  const [phone, setPhone] = useState(initialValues.phone ?? "");
  const [address, setAddress] = useState(initialValues.address ?? "");
  const [errors, setErrors] = useState({});

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setName(initialValues.name ?? "");
    setAge(
      initialValues.age !== undefined && initialValues.age !== null
        ? String(initialValues.age)
        : ""
    );
    setLevel(initialValues.level ?? "Beginner");
    setNotes(initialValues.notes ?? "");
    setPhone(initialValues.phone ?? "");
    setAddress(initialValues.address ?? "");
    setErrors({});

    // ✅ هنا التعديل المهم
    if (initialValues.image) {
      setPreview(initialValues.image); // ← سيبه زي ما هو (Cloudinary URL)
    } else {
      setPreview(null);
    }

    setImageFile(null);
  }, [initialValues]);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    const phoneRegex = /^[0-9+\-() ]{7,20}$/;
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!age) nextErrors.age = "Age is required";
    if (!phone.trim()) nextErrors.phone = "Phone is required";
    else if (!phoneRegex.test(phone.trim())) {
      nextErrors.phone = "Phone format is invalid";
    }
    if (!address.trim()) nextErrors.address = "Address is required";
    else if (address.trim().length < 3) {
      nextErrors.address = "Address must be at least 3 characters";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    const formData = new FormData();

    formData.append("name", name.trim());
    formData.append("age", age === "" ? "" : Number(age));
    formData.append("level", level);
    formData.append("phone", phone.trim());
    formData.append("address", address.trim());
    formData.append("notes", notes);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300">
            Photo <span className="text-slate-500">(optional)</span>
          </label>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-800 to-slate-900 text-xl font-semibold text-slate-400 shadow-inner ring-1 ring-cyan-400/10">
              {preview ? (
                <img src={preview} className="h-full w-full object-cover" alt="" />
              ) : (
                name?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-sm file:font-medium file:text-cyan-100 hover:file:bg-cyan-500/30"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300">Name</label>
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: null }));
            }}
            className="input-field !px-3 !py-2"
          />
          {errors.name ? <p className="mt-1 text-xs text-red-300">{errors.name}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Age</label>
          <input
            type="number"
            min={0}
            required
            value={age}
            onChange={(e) => {
              setAge(e.target.value);
              setErrors((prev) => ({ ...prev, age: null }));
            }}
            className="input-field !px-3 !py-2"
          />
          {errors.age ? <p className="mt-1 text-xs text-red-300">{errors.age}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Phone</label>
          <input
            type="tel"
            required
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((prev) => ({ ...prev, phone: null }));
            }}
            className="input-field !px-3 !py-2"
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-300">{errors.phone}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field-select !px-3 !py-2">
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300">Address</label>
          <input
            type="text"
            required
            placeholder="Enter address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setErrors((prev) => ({ ...prev, address: null }));
            }}
            className="input-field !px-3 !py-2"
          />
          {errors.address ? <p className="mt-1 text-xs text-red-300">{errors.address}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300">
            Notes <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field min-h-[6rem] resize-y !px-3 !py-2"
          />
        </div>
      </div>

      <div className="sticky bottom-[-1px] z-10 -mx-6 mt-4 border-t border-white/10 bg-[rgba(10,22,46,0.92)] px-6 py-3">
        <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn-secondary disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
      </div>
    </form>
  );
}