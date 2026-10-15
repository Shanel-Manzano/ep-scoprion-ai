import React from 'react';

// One plain sentence about where things stand. The step tracker at the top is the only timeline.
export default function WebsiteSteps({ text }) {
  return <p className="statusline"><b>Right now:</b> {text}</p>;
}
