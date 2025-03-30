import React, { useRef, useEffect } from "react";
import { render as globalRender } from "../index";

export const TinySparkChart: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Call the global render function once this element is mounted.
    if (chartRef.current) {
      globalRender();
    }
  }, []);

  return <div ref={chartRef} className="tiny-spark" {...props} />;
};
