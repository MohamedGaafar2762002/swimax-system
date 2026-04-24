import { useEffect, useState } from "react";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const empty = { name: "", age: "", level: "Beginner", notes: "", image: "" };

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

    const formData = new FormData();

    formData.append("name", name);
    formData.append("age", age === "" ? "" : Number(age));
    formData.append("level", level);
    formData.append("notes", notes);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300">
          Photo <span className="text-slate-500">(optional)</span>
        </label>

        <div className="mt-2 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-800 to-slate-900 text-xl font-semibold text-slate-400 shadow-inner ring-1 ring-cyan-400/10">
            {preview ? (
              <img
                src={preview}
                className="h-full w-full object-cover"
                alt=""
              />
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

      <div>
        <label className="block text-sm font-medium text-slate-300">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">Age</label>
        <input
          type="number"
          min={0}
          required
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">
          Level
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="input-field-select"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">
          Notes <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field min-h-[6rem] resize-y"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
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
    </form>
  );
}