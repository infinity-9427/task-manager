import { useTranslations } from "next-intl";

export const Menu = () => {
  const t = useTranslations("Menu");

  const options = [
    {
      item: t("home"),
      path: "/"
    },
    {
      item: t("about"),
      path: "/about"
    },
    {
      item: t("accommodations"),
      path: "/accommodations"
    },
    {
      item: t("dining"),
      path: "/dining"
    },
    {
      item: t("facilities"),
      path: "/facilities"
    },
    {
      item: t("events"),
      path: "/events"
    },
    {
      item: t("activities"),
      path: "/activities"
    },
    {
      item: t("gallery"),
      path: "/gallery"
    },
    {
      item: t("reservations"),
      path: "/reservations"
    },
    {
      item: t("contact"),
      path: "/contact"
    },
    {
      item: t("faq"),
      path: "/faq"
    }
  ];

  return options;
};


export const getMetadata = ( messages: any ) => {
  const metadataMessages = messages.Metadata as { title: string; description: string; keywords: string };

  return {
    title: metadataMessages.title,
    description: metadataMessages.description,
    keywords: metadataMessages.keywords
  };
};
