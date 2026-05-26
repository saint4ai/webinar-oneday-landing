"use client";

import React, { useEffect, useState } from "react";
import {
  PhoneInput as IntPhoneInput,
  type CountryIso2,
} from "react-international-phone";
import "react-international-phone/style.css";

/**
 * Phone input с автоматическим определением кода страны по IP.
 *
 * - При mount fetch ipapi.co/json → берёт `country_code` (например "KZ")
 * - Default fallback: "kz" (т.к. ЦА Александра — Казахстан)
 * - Стилизация под бренд (dark + orange focus)
 */

type Props = {
  value: string;
  onChange: (val: string) => void;
  id?: string;
};

const DEFAULT_COUNTRY: CountryIso2 = "kz";

export const BrandPhoneInput = ({ value, onChange, id }: Props) => {
  const [country, setCountry] = useState<CountryIso2>(DEFAULT_COUNTRY);
  const [detected, setDetected] = useState(false);

  // GeoIP detection (1 раз при mount)
  useEffect(() => {
    if (detected) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("ipapi failed");
        const data = (await res.json()) as { country_code?: string };
        if (cancelled) return;
        if (data.country_code) {
          setCountry(data.country_code.toLowerCase() as CountryIso2);
        }
      } catch {
        // тихо fallback на DEFAULT_COUNTRY (kz)
      } finally {
        if (!cancelled) setDetected(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detected]);

  return (
    <div className="brand-phone-wrapper">
      <IntPhoneInput
        defaultCountry={country}
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
