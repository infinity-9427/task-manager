import {useTranslations} from 'next-intl';
import PageLayout from './PageLayout';
import Link from 'next/link';

export default function NotFoundPage() {
  const t = useTranslations('NotFoundPage');

  return (
    <PageLayout title={t('title')}>
      <div className="w-full">
        <p className="mt-2  text-center  text-gray-400 md:text-lg lg:text-2xl xl:text-2xl ">
          {t('description')}
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="
            inline-block rounded-md bg-green-600 px-4 py-2 
            text-white hover:bg-green-700 
            focus:outline-none focus:ring-2 focus:ring-green-400
          "
          >
           {t("backHome")}
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

// NotFoundPage.tsx
// import {useTranslations} from 'next-intl';
// import PageLayout from './PageLayout';
// import Link from './NavigationLink';

// export default function NotFoundPage() {
//   const t = useTranslations('NotFoundPage');

//   return (
//     <PageLayout title={t('title')}>
//       <p className="mt-2 text-center text-gray-700 md:text-lg lg:text-xl">
//         {t('description')}
//       </p>

// <div className="mt-6">
//   <Link
//     href="/"
//     className="
//       inline-block rounded-md bg-green-600 px-4 py-2
//       text-white hover:bg-green-700
//       focus:outline-none focus:ring-2 focus:ring-green-400
//     "
//   >
//     Go Back Home
//   </Link>
// </div>
//     </PageLayout>
//   );
// }
