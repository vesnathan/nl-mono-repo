type ShoeProps = {
  numDecks: number;
  cardsDealt: number;
  dealerCutCard: number;
};

const Shoe = ({
  numDecks,
  cardsDealt,
  dealerCutCard,
}: ShoeProps): JSX.Element => {
  return (
    <div
      style={{
        position: "absolute",
        width: "6%",
        height: "25%",
        paddingBottom: "6%",
        right: "7%",
        top: "20px",
        // eslint-disable-next-line sonarjs/no-duplicate-string
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
              bottom: `${(numDecks * 52 - cardsDealt - dealerCutCard) / 4.16}%`,
              border: "1px solid rgb(0, 0, 0)",
              zIndex: 10000,
            }}
          />
          {/* Remaining cards - striped background matching card height */}
          <div
            style={{
              width: "87%",
              backgroundImage: "url(/assets/images/cardSide.png)",
              backgroundSize: "cover",
              backgroundRepeat: "repeat-y",
              position: "absolute",
              bottom: "0%",
              left: "6.5%",
              height: `${(numDecks * 52 - cardsDealt) / 4.16}%`,
            }}
          />
        </div>

        {/* Card backs showing at the opening - maintaining proper card aspect ratio */}
        <div
          style={{
            width: "52%",
            height: "50%",
            backgroundImage: "url(/assets/images/back.webp)",
            backgroundSize: "100% 100%",
            transform: "rotate(90deg)",
            position: "absolute",
            top: "92%",
            left: "24%",
            zIndex: 999,
          }}
        />
        <div
          style={{
            width: "52%",
            height: "50%",
            backgroundImage: "url(/assets/images/back.webp)",
            backgroundSize: "100% 100%",
            transform: "rotate(90deg)",
            position: "absolute",
            top: "82%",
            left: "24%",
            zIndex: 998,
          }}
        />
      </div>
    </div>
  );
};

export default Shoe;
