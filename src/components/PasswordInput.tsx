"use client";

import { InputHTMLAttributes, useId, useState } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export default function PasswordInput({ label, id, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={inputId}>
      {label}
      <span className="password-field">
        <input {...props} id={inputId} type={visible ? "text" : "password"} />
        <button
          aria-label={visible ? "隐藏密码" : "查看密码"}
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          title={visible ? "隐藏密码" : "查看密码"}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M2.6 12s3.4-6 9.4-6 9.4 6 9.4 6-3.4 6-9.4 6-9.4-6-9.4-6Z" />
            <circle cx="12" cy="12" r="3" />
            {visible ? <path className="eye-slash" d="M4 20 20 4" /> : null}
          </svg>
        </button>
      </span>
    </label>
  );
}
