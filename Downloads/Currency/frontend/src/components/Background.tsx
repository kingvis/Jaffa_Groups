export default function Background() {
  return (
    <div className="cosmic-bg" aria-hidden="true">
      <div className="grid-lines" />
      {/* Floating orbs */}
      <div
        className="orb"
        style={{
          width: 400,
          height: 400,
          background: 'rgba(6, 78, 139, 0.35)',
          top: '-10%',
          left: '-5%',
          animationDelay: '0s',
        }}
      />
      <div
        className="orb"
        style={{
          width: 300,
          height: 300,
          background: 'rgba(88, 28, 135, 0.35)',
          top: '30%',
          right: '-8%',
          animationDelay: '3s',
        }}
      />
      <div
        className="orb"
        style={{
          width: 250,
          height: 250,
          background: 'rgba(5, 150, 105, 0.2)',
          bottom: '10%',
          left: '20%',
          animationDelay: '1.5s',
        }}
      />
      <div
        className="orb"
        style={{
          width: 200,
          height: 200,
          background: 'rgba(0, 212, 255, 0.15)',
          top: '60%',
          right: '25%',
          animationDelay: '4s',
        }}
      />
    </div>
  )
}
