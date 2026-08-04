import { Link } from 'react-router-dom';
import { PLAN_UPGRADE_PATH } from '../lib/planEntitlements';

type Props = {
  message: string;
  className?: string;
};

export function PlanUpgradeBanner({ message, className = '' }: Props) {
  return (
    <p
      className={`text-sm font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 ${className}`}
    >
      {message}{' '}
      <Link to={PLAN_UPGRADE_PATH} className="underline text-primary hover:text-primary-hover">
        Upgrade plan
      </Link>
    </p>
  );
}
