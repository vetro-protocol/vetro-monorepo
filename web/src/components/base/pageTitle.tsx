export const PageTitle = ({ value }: { value: string }) => (
  <div className="flex h-50 w-full items-center justify-center text-center">
    <h1 className="text-h2 md:text-h1 sm:max-w-2/3 md:max-w-1/2 lg:max-w-2/5">
      {value}
    </h1>
  </div>
);
