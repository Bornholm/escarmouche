import React, { useState, useEffect } from "react";
import { Unit } from "../types";
import { Card } from "./Card";
import { generateId } from "./storage";

interface UnitEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: Unit) => void;
  unit?: Unit | null;
}

export const UnitEditor: React.FC<UnitEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  unit,
}) => {
  const [formData, setFormData] = useState<Unit>({
    id: "",
    name: "",
    health: 1,
    move: 1,
    reach: 1,
    attack: 1,
    imageUrl: "templar_knight.png",
  });

  // Initialize form data when unit prop changes
  useEffect(() => {
    if (unit) {
      setFormData({ ...unit });
    } else {
      setFormData({
        id: generateId(),
        name: "",
        health: 1,
        move: 1,
        reach: 1,
        attack: 1,
        imageUrl: "templar_knight.png",
      });
    }
  }, [unit, isOpen]);

  const handleInputChange = (field: keyof Unit, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "2rem",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
  };

  const sideBySideStyle: React.CSSProperties = {
    display: "flex",
    gap: "2rem",
    alignItems: "flex-start",
  };

  const formSectionStyle: React.CSSProperties = {
    flex: 1,
    minWidth: "300px",
  };

  const cardSectionStyle: React.CSSProperties = {
    flex: "0 0 auto",
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: "1rem",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "bold",
    color: "#333",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "2rem",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
  };

  const saveButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#007bff",
    color: "white",
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    color: "white",
  };

  return (
    <div style={modalStyle} onClick={handleCancel}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2>{unit ? "Edit Unit" : "Create New Unit"}</h2>

        <div style={sideBySideStyle}>
          <div style={formSectionStyle}>
            <form onSubmit={handleSubmit}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  style={inputStyle}
                  placeholder="Enter unit name"
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Health:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.health}
                  onChange={(e) =>
                    handleInputChange("health", parseInt(e.target.value) || 1)
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Move:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.move}
                  onChange={(e) =>
                    handleInputChange("move", parseInt(e.target.value) || 1)
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Reach:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.reach}
                  onChange={(e) =>
                    handleInputChange("reach", parseInt(e.target.value) || 1)
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Attack:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.attack}
                  onChange={(e) =>
                    handleInputChange("attack", parseInt(e.target.value) || 1)
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Image:</label>
                <select
                  value={formData.imageUrl || "templar_knight.png"}
                  onChange={(e) =>
                    handleInputChange("imageUrl", e.target.value)
                  }
                  style={selectStyle}
                >
                  <option value="templar_knight.png">Templar Knight</option>
                  <option value="elven_archer.png">Elven Archer</option>
                  <option value="fire_mage.png">Fire Mage</option>
                </select>
              </div>

              <div style={buttonGroupStyle}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>
                <button type="submit" style={saveButtonStyle}>
                  {unit ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>

          <div style={cardSectionStyle}>
            <h3>Preview:</h3>
            <Card unit={formData} />
          </div>
        </div>
      </div>
    </div>
  );
};
