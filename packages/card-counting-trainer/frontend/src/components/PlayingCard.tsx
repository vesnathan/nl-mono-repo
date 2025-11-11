"use client";

interface Card {
  suit: string;
  rank: string;
}

interface PlayingCardProps {
  card: Card;
  faceDown?: boolean;
}

// Pip layouts for each rank (from reference project)
const getPipLayout = (rank: string): string[] => {
  switch (rank) {
    case "A":
      return [
        " ",
        " ",
        " ",
        " ",
        " ",
        " ",
        " ",
        "A",
        " ",
        " ",
        " ",
        " ",
        " ",
        " ",
        " ",
      ];
    case "2":
      return [
        "O",
        "O",
        "O",
        "O",
        "X",
        "O",
        "O",
        "O",
        "O",
        "O",
        "X",
        "O",
        "O",
        "O",
        "O",
      ];
    case "3":
      return [
        "O",
        "X",
        "O",
        "O",
        "O",
        "O",
        "O",
        "X",
        "O",
        "O",
        "O",
        "O",
        "O",
        "X",
        "O",
      ];
    case "4":
      return [
        "X",
        "O",
        "X",
        "O",
        "O",
        "O",
        "O",
        "O",
        "O",
        "O",
        "O",
        "O",
        "X",
        "O",
        "X",
      ];
    case "5":
      return [
        "X",
        "O",
        "X",
        "O",
        "O",
        "O",
        "O",
        "X",
        "O",
        "O",
        "O",
        "O",
        "X",
        "O",
        "X",
      ];
    case "6":
      return [
        "X",
        "O",
        "X",
        "O",
        "O",
        "O",
        "X",
        "O",
        "X",
        "O",
        "O",
        "O",
        "X",
        "O",
        "X",
      ];
    case "7":
      return [
        "X",
        "O",
        "X",
        "O",
        "X",
        "O",
        "X",
        "O",
        "X",
        "O",
        "O",
        "O",
        "X",
        "O",
        "X",
      ];
    case "8":
      return [
        "X",
        "O",
        "X",
        "O",
        "X",
        "O",
        "X",
        "O",
        "X",
        "O",
        "X",
        "O",
        "X",
        "O",
        "X",
      ];
    case "9":
      return [
        "X",
        "X",
        "X",
        "O",
        "O",
        "O",
        "X",
        "X",
        "X",
        "O",
        "O",
        "O",
        "X",
        "X",
        "X",
      ];
    case "10":
      return [
        "X",
        "X",
        "X",
        "X",
        "X",
        "X",
        "O",
        "X",
        "O",
        "X",
        "X",
        "X",
        "O",
        "O",
        "O",
      ];
    default:
      return [];
  }
};

export default function PlayingCard({ card, faceDown }: PlayingCardProps) {
  if (faceDown) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: "url(/back.webp)",
          backgroundSize: "100% 100%",
          borderRadius: "5px",
          position: "relative",
          zIndex: 10,
        }}
      />
    );
  }

  // Convert suit letter to Unicode symbol and get suit code
  const getSuitSymbol = (suit: string): string => {
    switch (suit) {
      case "H":
        return String.fromCharCode(9829); // ♥
      case "D":
        return String.fromCharCode(9830); // ♦
      case "C":
        return String.fromCharCode(9827); // ♣
      case "S":
        return String.fromCharCode(9824); // ♠
      default:
        return "";
    }
  };

  const suitSymbol = getSuitSymbol(card.suit);
  const isRed = card.suit === "H" || card.suit === "D";
  const suitColor = isRed ? "red" : "rgb(0, 0, 0)";
  const isFaceCard = ["J", "Q", "K"].includes(card.rank);
  const isAce = card.rank === "A";
  const pipLayout = getPipLayout(card.rank);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgb(255, 255, 255)",
          borderRadius: "0.5em",
          position: "absolute",
          border: "1px solid rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Top-left corner */}
        <div
          style={{
            position: "absolute",
            top: "0.2em",
            left: "0.2em",
            fontSize: "15px",
            textAlign: "center",
            fontWeight: "bold",
            lineHeight: "80%",
            color: suitColor,
          }}
        >
          <div>{card.rank}</div>
          <div>{suitSymbol}</div>
        </div>

        {/* Top-right corner */}
        <div
          style={{
            position: "absolute",
            top: "0.2em",
            right: "0.2em",
            fontSize: "15px",
            textAlign: "center",
            fontWeight: "bold",
            lineHeight: "80%",
            color: suitColor,
          }}
        >
          <div>{card.rank}</div>
          <div>{suitSymbol}</div>
        </div>

        {/* Bottom-left corner (rotated) */}
        <div
          style={{
            position: "absolute",
            bottom: "0.2em",
            left: "0.2em",
            transform: "rotate(180deg)",
            fontSize: "15px",
            textAlign: "center",
            fontWeight: "bold",
            lineHeight: "80%",
            color: suitColor,
          }}
        >
          <div>{card.rank}</div>
          <div>{suitSymbol}</div>
        </div>

        {/* Bottom-right corner (rotated) */}
        <div
          style={{
            position: "absolute",
            bottom: "0.2em",
            right: "0.2em",
            transform: "rotate(180deg)",
            fontSize: "15px",
            textAlign: "center",
            fontWeight: "bold",
            lineHeight: "80%",
            color: suitColor,
          }}
        >
          <div>{card.rank}</div>
          <div>{suitSymbol}</div>
        </div>

        {/* Pip holder for center */}
        <div
          style={{
            padding: "15%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Face cards (J, Q, K) */}
          {isFaceCard && (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(/${card.rank}.svg)`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
          )}

          {/* Ace */}
          {isAce && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "45px",
                color: suitColor,
              }}
            >
              {suitSymbol}
            </div>
          )}

          {/* Number cards with pip layouts */}
          {!isFaceCard && !isAce && pipLayout.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(5, 1fr)",
                width: "100%",
                height: "100%",
                textAlign: "center",
              }}
            >
              {pipLayout.map((pip, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {pip === "X" && (
                    <div
                      style={{
                        fontSize: "18px",
                        color: suitColor,
                        lineHeight: 1,
                      }}
                    >
                      {suitSymbol}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
