'use client';
import { useParams } from 'next/navigation';
import BranchDetail from '../../../../components/admin/BranchDetail';

export default function BranchDetailPage() {
  const params = useParams();
  return <BranchDetail branchId={params.branchId} />;
}
