import { PageTitle } from "components/base/pageTitle";
import { ContactForm } from "components/contactForm";
import { Trans, useTranslation } from "react-i18next";

const supportEmail = "support@vetro.org";

export function Contact() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center">
      <PageTitle value={t("pages.contact.title")} />
      <ContactForm />
      <p className="text-caption mt-4 text-gray-500">
        <Trans
          components={{
            emailLink: (
              <a
                className="text-blue-500 underline"
                href={`mailto:${supportEmail}`}
              />
            ),
          }}
          i18nKey="pages.contact.email-us-directly"
          values={{ email: supportEmail }}
        />
      </p>
    </div>
  );
}
