const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const PromptCardSkeleton = () => {
  return (
    <div className='prompt_card'>
      <div className='flex justify-between items-start gap-5'>
        <div className='flex-1 flex justify-start items-center gap-3'>
          <Skeleton className="w-[40px] h-[40px] rounded-full" />
          <div className='flex flex-col gap-2'>
            <Skeleton className="w-24 h-4" />
          </div>
        </div>
        <Skeleton className="w-7 h-7 rounded-full" />
      </div>

      <div className="my-4 flex flex-col gap-2">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-5/6 h-4" />
        <Skeleton className="w-2/3 h-4" />
      </div>
      
      <Skeleton className="w-16 h-4" />
    </div>
  );
};

export default PromptCardSkeleton;
