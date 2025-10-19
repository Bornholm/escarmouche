import React from "react";
import { Evaluation, Unit } from "../types";
import { useAsyncMemo } from "../hooks/useAsyncMemo";

interface CardProps {
  unit?: Unit;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  unit = {
    id: "sample",
    name: "Sample Unit",
    health: 100,
    range: 3,
    move: 2,
    power: 25,
    abilities: [],
  },
  style,
}) => {
  const evaluation = useAsyncMemo<Evaluation>(() => {
    return Barracks.evaluateUnit(unit);
  }, [unit]);

  const cardContainerStyle: React.CSSProperties = {
    width: "300px",
    height: "420px",
  };

  const cardStyle: React.CSSProperties = {
    border: "5px solid #333",
    height: "100%",
    width: "100%",
    borderRadius: "10px",
    background:
      "linear-gradient(340deg, rgba(255, 247, 217, 1) 0%, rgba(247, 247, 247, 1) 100%)",
    padding: "10px",
    position: "relative",
  };

  const cardBackgroundStyle: React.CSSProperties = {
    backgroundImage: unit.imageUrl ? `url(${unit.imageUrl})` : undefined,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    backgroundPositionX: "50px",
    backgroundPositionY: "30px",
    height: "100%",
    width: "100%",
  };

  const cardHeaderStyle: React.CSSProperties = {
    color: "#333",
    marginBottom: "2em",
  };

  const cardTitleStyle: React.CSSProperties = {
    color: "#333",
    fontWeight: "bold",
    textShadow: "1px 1px white",
    fontSize: "1.2em",
  };

  const cardSubtitleStyle: React.CSSProperties = {
    color: "#333",
    fontStyle: "italic",
    fontSize: "0.7em",
    verticalAlign: "super",
  };

  const cardCharacteristicStyle: React.CSSProperties = {
    color: "#333",
    fontSize: "0.8em",
  };

  const cardCharacteristicLabelStyle: React.CSSProperties = {
    width: "25%",
    display: "inline-block",
    fontWeight: "bold",
  };

  const cardCharacteristicValueStyle: React.CSSProperties = {
    marginLeft: "1em",
    textAlign: "left",
    display: "inline-block",
  };

  const cardAbilityStyle: React.CSSProperties = {
    backgroundColor: "rgb(75, 67, 67)",
    color: "rgb(247, 247, 247)",
    position: "absolute",
    padding: "5px 10px",
    fontSize: "0.8em",
    inset: "310px 10px 10px",
    borderRadius: "5px",
    display: "flex",
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <div style={{ ...cardContainerStyle, ...(style ?? {}) }}>
      <div style={cardStyle}>
        <div style={cardBackgroundStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>{unit.name}</span>
            <br />
            <span style={cardSubtitleStyle}>{evaluation?.rank}</span>
          </div>
          <div style={cardCharacteristicStyle}>
            <span style={cardCharacteristicLabelStyle}>Health</span>
            <span style={cardCharacteristicValueStyle}>{unit.health}</span>
          </div>
          <div style={cardCharacteristicStyle}>
            <span style={cardCharacteristicLabelStyle}>Move</span>
            <span style={cardCharacteristicValueStyle}>{unit.move}</span>
          </div>
          <div style={cardCharacteristicStyle}>
            <span style={cardCharacteristicLabelStyle}>Range</span>
            <span style={cardCharacteristicValueStyle}>{unit.range}</span>
          </div>
          <div style={cardCharacteristicStyle}>
            <span style={cardCharacteristicLabelStyle}>Power</span>
            <span style={cardCharacteristicValueStyle}>{unit.power}</span>
          </div>
          {unit.abilities?.length > 0 ? (
            <div style={cardAbilityStyle}>
              {unit.abilities?.map((a) => (
                <span key={a.id}>{a.label}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
