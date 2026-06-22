export function XmbBackground() {
  return (
    <div className="xmb-bg" aria-hidden="true">
      <svg
        className="xmb-waves"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path
            key={i}
            d={`M-100 ${120 + i * 90} Q360 ${80 + i * 90 + (i % 2 ? 30 : -20)} 720 ${120 + i * 90} T1540 ${120 + i * 90}`}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
}
