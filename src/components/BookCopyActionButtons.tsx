"use client";

import { useState } from "react";

export default function BookCopyActionButtons({ copyCode, canReturn }: { copyCode: string; canReturn: boolean }) {
  const [message, setMessage] = useState("");

  async function act(endpoint: string) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ copyCode }),
    });
    const body = await res.json();
    setMessage(body.message);
  }

  return (
    <div className="stack">
      {message ? <div className="message">{message}</div> : null}
      <div className="row">
        <button onClick={() => act("/api/borrow")} type="button">借阅此书</button>
        {canReturn ? <button className="secondary" onClick={() => act("/api/return")} type="button">归还此书</button> : null}
      </div>
    </div>
  );
}
