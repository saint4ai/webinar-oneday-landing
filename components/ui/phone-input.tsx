"use client";

import React from "react";
import {
  PhoneInput as IntPhoneInput,
  type CountryIso2,
} from "react-international-phone";
import "react-international-phone/style.css";

/**
 * Phone input, дефолт — Казахстан.
 *
 * GeoIP-детект по ipapi.co УБРАН (2026-07-12): внешний fetch падал по CORS
 * на КАЖДОЙ загрузке (лишний failed-request + шум в консоли), а ЦА и так 99%
 * Казахстан → дефолт "kz" покрывает всё. Юзер может сменить страну руками.
 * В in-app webview внешний fetch — лишний риск повиснуть на медленной сети.
 */

type Props = {
  value: string;
  onChange: (val: string) => void;
  id?: string;
};

const DEFAULT_COUNTRY: CountryIso2 = "kz";

export const BrandPhoneInput = ({ value, onChange, id }: Props) => {
  return (
    <div className="brand-phone-wrapper">
      <IntPhoneInput
        defaultCountry={DEFAULT_COUNTRY}
        value={value}
        onChange={onChange}
        inputProps={{ id, autoComplete: "tel" }}
        forceDialCode
        disableDialCodeAndPrefix={false}
      />
      <style jsx global>{`
        .brand-phone-wrapper .react-international-phone-input-container {
          width: 100%;
          display: flex;
          gap: 0;
        }
        .brand-phone-wrapper .react-international-phone-country-selector-button {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-right: none;
          border-radius: 8px 0 0 8px;
          padding: 0 10px;
          height: 50px;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .brand-phone-wrapper
          .react-international-phone-country-selector-button:hover {
          background: rgba(252, 92, 2, 0.06);
        }
        .brand-phone-wrapper
          .react-international-phone-country-selector-button__button-content {
          gap: 6px;
        }
        .brand-phone-wrapper .react-international-phone-country-selector-button__flag-emoji {
          font-size: 18px;
        }
        .brand-phone-wrapper
          .react-international-phone-country-selector-button__dropdown-arrow {
          color: rgba(255, 255, 255, 0.45);
        }
        .brand-phone-wrapper .react-international-phone-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0 8px 8px 0;
          padding: 0 16px;
          color: #fff;
          font-size: 15px;
          height: 50px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .brand-phone-wrapper .react-international-phone-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
        .brand-phone-wrapper .react-international-phone-input:focus,
        .brand-phone-wrapper
          .react-international-phone-country-selector-button:focus {
          border-color: rgba(252, 92, 2, 0.5);
        }
        .brand-phone-wrapper .react-international-phone-country-selector-dropdown {
          background: #0a0a0c;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          max-height: 260px;
          z-index: 100;
        }
        .brand-phone-wrapper
          .react-international-phone-country-selector-dropdown__list-item {
          color: rgba(255, 255, 255, 0.85);
          padding: 8px 12px;
        }
        .brand-phone-wrapper
          .react-international-phone-country-selector-dropdown__list-item:hover {
          background: rgba(252, 92, 2, 0.08);
        }
        .brand-phone-wrapper
          .react-international-phone-country-selector-dropdown__list-item--selected {
          background: rgba(252, 92, 2, 0.15);
          color: #fff;
        }
        .brand-phone-wrapper
          .react-international-phone-country-selector-dropdown__list-item-dial-code {
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};
