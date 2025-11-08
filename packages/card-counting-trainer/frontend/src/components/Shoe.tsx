type ShoeProps = {
  numDecks: number;
  cardsDealt: number;
  dealerCutCard: number;
};

const Shoe = ({ numDecks, cardsDealt, dealerCutCard }: ShoeProps): JSX.Element => {
  return (
    <div
      style={{
        position: "absolute",
        width: "8%",
        height: "25%",
        paddingBottom: "8%",
        right: "7%",
        top: "20px",
        transform: "rotate(90deg)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgb(0, 0, 0)",
          position: "absolute",
        }}
      >
        {/* Shoe cover */}
        <div
          style={{
            width: "100%",
            height: "20%",
            backgroundColor: "rgba(0, 0, 0, .5)",
            position: "absolute",
            bottom: "-30px",
            zIndex: 1000,
          }}
        />

        {/* Decks holder */}
        <div
          style={{
            width: "100%",
            height: "80%",
            position: "absolute",
            bottom: "0%",
          }}
        >
          {/* Cut card indicator */}
          <div
            style={{
              height: "1px",
              position: "absolute",
              width: "87%",
              left: "6.5%",
              bottom: `${(((numDecks * 52) - cardsDealt - dealerCutCard) / 4.16)}%`,
              border: "1px solid rgb(0, 0, 0)",
              zIndex: 10000,
            }}
          />
          {/* Remaining cards */}
          <div
            style={{
              width: "87%",
              backgroundImage: "url(/assets/images/cardSide.png)",
              position: "absolute",
              bottom: "0%",
              left: "6.5%",
              height: `${(((numDecks * 52) - cardsDealt) / 4.16)}%`,
            }}
          />
        </div>

        {/* Card backs showing at the opening */}
        <div
          style={{
            width: "60%",
            height: "50%",
            backgroundImage: "url(/assets/images/back.webp)",
            backgroundSize: "100% 100%",
            transform: "rotate(90deg)",
            position: "absolute",
            top: "92%",
            left: "20%",
            zIndex: 999,
          }}
        />
        <div
          style={{
            width: "60%",
            height: "50%",
            backgroundImage: "url(/assets/images/back.webp)",
            backgroundSize: "100% 100%",
            transform: "rotate(90deg)",
            position: "absolute",
            top: "82%",
            left: "20%",
            zIndex: 998,
          }}
        />
      </div>
    </div>
  );
};

export default Shoe;
