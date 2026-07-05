"use client";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  DataGrid,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridColDef,
  GridFilterModel,
  GridLogicOperator,
  GridPaginationModel,
  GridSortModel,
  useGridApiRef,
} from "@mui/x-data-grid";
import Footer from "@/components/Footer/Footer";
import {
  revenueRecords,
  type RevenueRecordQuery,
  type RevenueRecordRow,
  type RevenueStatus,
} from "@/lib/api/analytics";
import { reportApiError } from "@/lib/api/client";
import { useUserSettings, type DefaultTimeRange } from "@/lib/api/settings";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import scss from "./Data.module.scss";

type RevenueGridRow = {
  accountOwner: string;
  amount: number;
  customerSegment: string;
  customerName: string;
  date: string;
  id: number;
  region: string;
  status: RevenueStatus;
};

// Region, Status, Revenue, and Date are fixed-width (their content has a
// predictable max length, so a fixed pixel width is the correct choice).
// Customer Name, Customer Segment, and Account Owner instead use `flex` with
// a floor `minWidth`, so any leftover container width is distributed
// proportionally across those three instead of leaving a blank gap after the
// last column or over-stretching a single column.
const revenueColumns: GridColDef<RevenueGridRow>[] = [
  {
    align: "left",
    field: "customerName",
    filterable: false,
    flex: 1.6,
    headerAlign: "left",
    headerName: "Customer Name",
    minWidth: 220,
    sortable: false,
  },
  {
    align: "left",
    field: "region",
    filterable: false,
    headerAlign: "left",
    headerName: "Region",
    sortable: false,
    width: 160,
  },
  {
    align: "left",
    field: "customerSegment",
    filterable: false,
    flex: 1,
    headerAlign: "left",
    headerName: "Customer Segment",
    minWidth: 160,
    sortable: false,
  },
  {
    align: "left",
    field: "accountOwner",
    filterable: false,
    flex: 1,
    headerAlign: "left",
    headerName: "Account Owner",
    minWidth: 160,
    sortable: false,
  },
  {
    align: "left",
    field: "amount",
    filterable: false,
    headerAlign: "left",
    headerName: "Revenue",
    sortable: true,
    type: "number",
    valueFormatter: (value: number) => formatCurrency(value),
    width: 140,
  },
  {
    align: "left",
    field: "status",
    headerAlign: "left",
    headerName: "Status",
    sortable: true,
    type: "singleSelect",
    valueOptions: ["LEAD", "NEGOTIATION", "WON", "LOST"],
    width: 120,
  },
  {
    align: "right",
    field: "date",
    headerAlign: "right",
    headerName: "Date",
    sortable: true,
    valueFormatter: (value: string) => formatDate(value),
    width: 140,
  },
];

// DataGrid auto-injects a checkbox column (via `checkboxSelection`) sized by
// `GRID_CHECKBOX_SELECTION_COL_DEF`. Spreading that default and overriding
// just its width keeps its built-in selection behavior while giving it the
// same explicit, fixed-width treatment as every other column.
const dataGridColumns: GridColDef<RevenueGridRow>[] = [
  { ...GRID_CHECKBOX_SELECTION_COL_DEF, width: 48 } as GridColDef<RevenueGridRow>,
  ...revenueColumns,
];

const Data = () => {
  const apiRef = useGridApiRef();
  const theme = useTheme();
  const { settings } = useUserSettings();
  const compactMode = settings?.compactMode ?? false;
  const hasAppliedSavedPageSize = useRef(false);
  const [rows, setRows] = useState<RevenueGridRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "date", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: GridLogicOperator.Or,
    quickFilterValues: [],
  });
  const searchValue = String(filterModel.quickFilterValues?.[0] ?? "");
  const activeFilterCount =
    filterModel.items.filter((item) => item.value != null && item.value !== "")
      .length + (searchValue ? 1 : 0);

  const query = useMemo(
    () => buildRevenueQuery(paginationModel, sortModel, filterModel, settings?.defaultTimeRange),
    [paginationModel, sortModel, filterModel, settings?.defaultTimeRange]
  );

  // Apply the saved table page size once, the first time it becomes
  // available, so it survives a refresh without overriding the person's
  // in-session pagination choice on every settings re-fetch.
  useEffect(() => {
    if (hasAppliedSavedPageSize.current || !settings) {
      return;
    }

    hasAppliedSavedPageSize.current = true;
    setPaginationModel((current) => ({
      ...current,
      pageSize: settings.tablePageSize,
    }));
  }, [settings]);

  useEffect(() => {
    let isMounted = true;

    const loadRevenueRows = async () => {
      setIsLoading(true);

      try {
        const response = await revenueRecords(query);

        if (!isMounted) {
          return;
        }

        const nextRows = Array.isArray(response?.rows)
          ? response.rows.map(mapRevenueRow)
          : [];

        setRows(nextRows);
        setRowCount(toNonNegativeInteger(response?.rowCount, nextRows.length));
      } catch (error) {
        reportApiError(error, "Revenue records");

        if (isMounted) {
          setRows([]);
          setRowCount(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRevenueRows();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setFilterModel((currentModel) => ({
      ...currentModel,
      quickFilterValues: value ? [value] : [],
    }));
  };

  const handleOpenFilters = () => {
    apiRef.current?.showFilterPanel();
  };

  const handleExport = () => {
    apiRef.current?.exportDataAsCsv({
      fileName: "datara-data-export",
    });
  };

  return (
    <main
      className={`${scss.dataPage} ${compactMode ? scss.compact : ""}`}
      data-compact-mode={compactMode}
    >
      <section className={scss.pageHeader}>
        <div>
          <Typography className={scss.eyebrow}>REVENUE DATA</Typography>
          <Typography component="h1" variant="h3">
            Data
          </Typography>
          <Typography className={scss.pageDescription}>
          Browse and manage the records behind your revenue dashboard.
          </Typography>
        </div>

      </section>

      <Paper
        className={`${scss.tableCard} ${compactMode ? scss.compact : ""}`}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 10px 24px rgba(0, 0, 0, 0.18)"
              : "0 10px 24px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div className={scss.tableToolbar}>
          <div>
            <Typography className={scss.tableTitle} component="h2">
              Revenue records
            </Typography>
            <Typography className={scss.tableSubtitle}>
            Search, filter, and export workspace revenue records.
            </Typography>
          </div>

          <div className={scss.toolbarActions}>
            <TextField
              className={scss.searchInput}
              onChange={handleSearchChange}
              placeholder="Search customers or plans"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              value={searchValue}
            />

            <Button
              className={scss.toolbarButton}
              onClick={handleOpenFilters}
              startIcon={<FilterListRoundedIcon />}
              variant="outlined"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className={scss.filterCount}>{activeFilterCount}</span>
              )}
            </Button>

            <Button
              className={scss.toolbarButton}
              onClick={handleExport}
              startIcon={<FileDownloadOutlinedIcon />}
              variant="outlined"
            >
              Export
            </Button>
          </div>
        </div>

        <div className={scss.tableScroll}>
          <Box className={scss.gridShell}>
            <DataGrid
              apiRef={apiRef}
              checkboxSelection
              columnHeaderHeight={compactMode ? 48 : 56}
              columns={dataGridColumns}
              density={compactMode ? "compact" : "standard"}
              disableRowSelectionOnClick
              filterMode="server"
              filterModel={filterModel}
              loading={isLoading}
              onFilterModelChange={(model) => {
                setFilterModel(model);
                setPaginationModel((current) => ({ ...current, page: 0 }));
              }}
              onPaginationModelChange={setPaginationModel}
              onSortModelChange={(model) => {
                setSortModel(model);
                setPaginationModel((current) => ({ ...current, page: 0 }));
              }}
              pageSizeOptions={[25, 50, 100]}
              paginationMode="server"
              paginationModel={paginationModel}
              rowCount={rowCount}
              rowHeight={compactMode ? 44 : 56}
              rows={rows}
              sortingMode="server"
              sortModel={sortModel}
              sx={{
                "--DataGrid-containerBackground":
                  theme.palette.mode === "dark"
                    ? theme.palette.background.paper
                    : "#f8fafc",
                border: 0,
                color: "text.primary",
                fontFamily: "inherit",
                "& .MuiDataGrid-columnHeaders": {
                  borderBottom: "1px solid",
                  borderColor: "divider",
                },
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.white, 0.03)
                      : alpha(theme.palette.grey[100], 0.82),
                },
                "& .MuiDataGrid-columnHeader:not(.MuiDataGrid-columnHeaderCheckbox)": {
                  paddingLeft: "24px",
                  paddingRight: "24px",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  color: "text.secondary",
                  fontSize: "0.74rem",
                  fontWeight: 760,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                },
                "& .MuiDataGrid-cell": {
                  borderColor: "divider",
                  fontSize: "0.88rem",
                },
                "& .MuiDataGrid-cell:not(.MuiDataGrid-cellCheckbox)": {
                  paddingLeft: "24px",
                  paddingRight: "24px",
                },
                "& .MuiDataGrid-row": {
                  transition: "background-color 140ms ease",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.045),
                },
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                },
                "& .MuiDataGrid-row.Mui-selected:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.11),
                },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                  outline: `2px solid ${alpha(theme.palette.secondary.main, 0.45)}`,
                  outlineOffset: -2,
                },
                "& .MuiDataGrid-footerContainer": {
                  borderColor: "divider",
                  minHeight: 56,
                },
                "& .MuiCheckbox-root": {
                  color: "text.secondary",
                },
                "& .MuiCheckbox-root.Mui-checked": {
                  color: "secondary.main",
                },
              }}
            />
          </Box>
        </div>
      </Paper>

      <Footer />
    </main>
  );
};

const mapRevenueRow = (row: RevenueRecordRow, index: number): RevenueGridRow => ({
  accountOwner:
    typeof row.account_owner === "string" ? row.account_owner : "Unassigned",
  amount: toFiniteNumber(row.amount),
  customerSegment:
    typeof row.customer_segment === "string" ? row.customer_segment : "Unassigned",
  customerName: typeof row.customer_name === "string" ? row.customer_name : "",
  date: typeof row.date === "string" ? row.date : "",
  id: toNonNegativeInteger(row.id, index),
  region: typeof row.region === "string" ? row.region : "Unassigned",
  status: isRevenueStatus(row.status) ? row.status : "LEAD",
});

const buildRevenueQuery = (
  paginationModel: GridPaginationModel,
  sortModel: GridSortModel,
  filterModel: GridFilterModel,
  defaultTimeRange?: DefaultTimeRange
): RevenueRecordQuery => {
  const sort = sortModel[0];
  const dateRange = getDateRange(filterModel);
  // An explicit date-column filter on the grid always wins; the saved
  // dashboard range is only applied as a default when the person hasn't set
  // their own date filter.
  const hasExplicitDateFilter = Boolean(dateRange.startDate || dateRange.endDate);

  return {
    page: paginationModel.page,
    size: paginationModel.pageSize,
    search: getSearchFilter(filterModel),
    sortBy: getSortField(sort?.field),
    sortDirection: sort?.sort === "asc" ? "asc" : "desc",
    status: getStatusFilter(filterModel),
    range: hasExplicitDateFilter ? undefined : defaultTimeRange,
    ...dateRange,
  };
};

const getSortField = (
  field: GridSortModel[number]["field"] | undefined
): RevenueRecordQuery["sortBy"] => {
  if (field === "amount" || field === "status") {
    return field;
  }
  return "date";
};

const getSearchFilter = (filterModel: GridFilterModel): string | undefined => {
  const value = String(filterModel.quickFilterValues?.[0] ?? "").trim();
  return value || undefined;
};

const getStatusFilter = (
  filterModel: GridFilterModel
): RevenueStatus | undefined => {
  const status = filterModel.items.find((item) => item.field === "status")?.value;
  return isRevenueStatus(status) ? status : undefined;
};

const getDateRange = (
  filterModel: GridFilterModel
): Pick<RevenueRecordQuery, "startDate" | "endDate"> => {
  return filterModel.items.reduce<Pick<RevenueRecordQuery, "startDate" | "endDate">>(
    (range, item) => {
      if (item.field !== "date" || !item.value) {
        return range;
      }

      const value = String(item.value);
      const operator = String(item.operator ?? "").toLowerCase();

      if (operator.includes("after") || operator.includes(">")) {
        return { ...range, startDate: value };
      }

      if (operator.includes("before") || operator.includes("<")) {
        return { ...range, endDate: value };
      }

      return { startDate: value, endDate: value };
    },
    {}
  );
};

const isRevenueStatus = (value: unknown): value is RevenueStatus => {
  return (
    value === "LEAD" ||
    value === "NEGOTIATION" ||
    value === "WON" ||
    value === "LOST"
  );
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(toFiniteNumber(value));
};

const formatDate = (value: string): string => {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toNonNegativeInteger = (value: unknown, fallback = 0): number => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= 0
    ? numberValue
    : fallback;
};

export default Data;
