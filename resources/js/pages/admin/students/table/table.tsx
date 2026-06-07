import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import Filters from './filters';

export default function Table() {
    const columns = ['#', 'Action', 'Email', 'Status', 'Date'];

    const data = [
        {
            id: 1,
            action: 'create',
            email: 'john@example.com',
            status: 'success',
            created_at: '2026-06-07',
        },
        {
            id: 2,
            action: 'update',
            email: 'jane@example.com',
            status: 'failed',
            created_at: '2026-06-06',
        },
        {
            id: 3,
            action: 'login',
            email: 'mark@example.com',
            status: 'success',
            created_at: '2026-06-05',
        },
    ];

    return (
        <div>
            <Filters />
            <div className="relative mt-3 overflow-x-auto rounded-md lg:border">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th key={column}>{column}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {data.length > 0 ? (
                            data.map((row) => (
                                <tr key={row.id}>
                                    <td data-label="#">{row.id}</td>

                                    <td data-label="Action">
                                        <Badge variant="outline">
                                            {row.action.toUpperCase()}
                                        </Badge>
                                    </td>

                                    <td data-label="Email">{row.email}</td>

                                    <td data-label="Status">
                                        <Badge
                                            variant="outline"
                                            className={
                                                row.status === 'success'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-red-600 text-white'
                                            }
                                        >
                                            {row.status.toUpperCase()}
                                        </Badge>
                                    </td>

                                    <td data-label="Date">
                                        {dayjs(row.created_at).format(
                                            'MMM D, YYYY',
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="force-center"
                                >
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>

                    <tfoot>
                        <tr>
                            <td colSpan={columns.length}>
                                <div className="table-footer">
                                    <p className="table-footer-text">
                                        Showing <strong>1</strong>–
                                        <strong>{data.length}</strong> of{' '}
                                        <strong>{data.length}</strong>
                                    </p>

                                    <div className="table-pagination">
                                        <button disabled>Previous</button>

                                        <button className="active">1</button>

                                        <button disabled>Next</button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
