import React from 'react';

export const TestGrid = () => {
    // Simple test data
    const testColumns = [
        { id: 1, label: 'Column 1' },
        { id: 2, label: 'Column 2' },
        { id: 3, label: 'Column 3' }
    ];

    const testData = [
        { _id: 1, 'Column 1': 'A1', 'Column 2': 'B1', 'Column 3': 'C1' },
        { _id: 2, 'Column 1': 'A2', 'Column 2': 'B2', 'Column 3': 'C2' }
    ];

    console.log('TestGrid - testColumns:', testColumns);
    console.log('TestGrid - testData:', testData);

    return (
        <div className="p-4">
            <h2 className="text-xl mb-4">Test Table</h2>
            <table className="border border-gray-300">
                <thead>
                    <tr>
                        <th className="border px-4 py-2">Actions</th>
                        {testColumns.map(col => (
                            <th key={col.id} className="border px-4 py-2">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {testData.map(row => (
                        <tr key={row._id}>
                            <td className="border px-4 py-2">Edit/Delete</td>
                            {testColumns.map(col => (
                                <td key={col.id} className="border px-4 py-2">
                                    {row[col.label]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
