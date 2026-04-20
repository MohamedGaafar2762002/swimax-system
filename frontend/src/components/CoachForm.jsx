import { useEffect, useState } from "react";

const empty = { name: "", age: "", bio: "", image: null };

export default function CoachForm({
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
  const [bio, setBio] = useState(initialValues.bio ?? "");

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setName(initialValues.name ?? "");
    setAge(
      initialValues.age !== undefined && initialValues.age !== null
        ? String(initialValues.age)
        : ""
    );
    setBio(initialValues.bio ?? "");

    if (initialValues.image) {
      setPreview(`http://localhost:5000/${initialValues.image}`);
    } else {
      setPreview(null);
    }

    setImage(null);
  }, [initialValues]);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);

    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("age", age === "" ? "" : Number(age));
    formData.append("bio", bio);

    if (image) {
      formData.append("image", image);
    }

    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300">
          Coach photo <span className="text-slate-500">(optional)</span>
        </label>

        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner ring-1 ring-sky-400/10">
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-slate-500">No photo</span>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="text-sm text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-500/20 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-200 hover:file:bg-sky-500/30"
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
          Bio <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="input-field min-h-[5rem] resize-y"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn-secondary disabled:opacity-50"
        >
          Cancel
        </button>

        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
