"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { AddClientWizard } from "./AddClientWizard";

export function AddClientButton({ locale }: { locale: string }) {
  const t = useTranslations("clients");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-gradient">
        <UserPlus className="w-4 h-4" />
        {t("addClient")}
      </button>
      {open ? (
        <AddClientWizard locale={locale} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
