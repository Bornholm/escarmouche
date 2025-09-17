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
    reach: 3,
    move: 2,
    attack: 25,
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
  };

  // Use custom image if available, otherwise use preset image
  const imageSource = unit.customImage || unit.imageUrl;

  const cardBackgroundStyle: React.CSSProperties = {
    backgroundImage: imageSource ? `url(${imageSource})` : undefined,
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
            <span style={cardCharacteristicLabelStyle}>Reach</span>
            <span style={cardCharacteristicValueStyle}>{unit.reach}</span>
          </div>
          <div style={cardCharacteristicStyle}>
            <span style={cardCharacteristicLabelStyle}>Attack</span>
            <span style={cardCharacteristicValueStyle}>{unit.attack}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
