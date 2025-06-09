import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText } from 'lucide-react';

export const MonthlyReports = () => {
  const [selectedMonth, setSelectedMonth] = React.useState('');
  const [selectedYear, setSelectedYear] = React.useState('');
  const [reportData, setReportData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = [
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' }
  ];

  const handleGenerateReport = async () => {
    if (!selectedMonth || !selectedYear) return;
    
    setLoading(true);
    try {
      console.log('Generating report for:', selectedYear, selectedMonth);
      
      const response = await fetch(`/api/reports/monthly/${selectedYear}/${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        console.log('Report generated:', data.length, 'users');
      } else {
        console.error('Failed to generate report:', response.statusText);
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (reportData.length === 0) return;
    
    console.log('Downloading report...');
    
    // Create CSV content
    const headers = ['Username', 'Profile', 'Total Sessions', 'Data Usage (GB)', 'Status', 'Last Active'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.username,
        row.profile,
        row.totalSessions,
        row.dataUsage,
        row.status,
        row.lastActive
      ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pppoe-report-${selectedYear}-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Monthly Reports</h2>
        <p className="text-muted-foreground">Generate reports for PPPoE Users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Report Generation</span>
          </CardTitle>
          <CardDescription>Select the month and year to generate reports for PPPoE Users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Button 
                onClick={handleGenerateReport} 
                disabled={!selectedMonth || !selectedYear || loading}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          {!selectedMonth || !selectedYear ? (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Please select month and year to generate report</p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Ready to generate report for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PPPoE Users Report</CardTitle>
                <CardDescription>
                  Report for {months.find(m => m.value === selectedMonth)?.label} {selectedYear} - {reportData.length} users
                </CardDescription>
              </div>
              <Button onClick={handleDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Total Sessions</TableHead>
                  <TableHead>Data Usage (GB)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.profile}</TableCell>
                    <TableCell>{user.totalSessions}</TableCell>
                    <TableCell>{user.dataUsage}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.lastActive}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedMonth && selectedYear && reportData.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No report data available</p>
              <p className="text-sm text-muted-foreground">
                No PPPoE user data found for the selected period. 
                Make sure devices are connected and users are configured.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
