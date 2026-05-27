"use client";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  DataGrid,
  GridFilterModel,
  GridLogicOperator,
  useGridApiRef,
} from "@mui/x-data-grid";
import { useDemoData } from "@mui/x-data-grid-generator";
import Footer from "@/components/Footer/Footer";
import { type ChangeEvent, useState } from "react";
import scss from "./Data.module.scss";

const ROW_LENGTH = 500;

const Data = () => {
  const apiRef = useGridApiRef();
  const theme = useTheme();
  const { data, loading } = useDemoData({
    dataSet: "Commodity",
    rowLength: ROW_LENGTH,
    maxColumns: 15,
  });
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: GridLogicOperator.Or,
    quickFilterValues: [],
  });
  const searchValue = String(filterModel.quickFilterValues?.[0] ?? "");
  const activeFilterCount =
    filterModel.items.filter((item) => item.value != null && item.value !== "")
      .length + (searchValue ? 1 : 0);

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
    <main className={scss.dataPage}>
      <section className={scss.pageHeader}>
        <div>
          <Typography className={scss.eyebrow}>Datara Data Warehouse</Typography>
          <Typography component="h1" variant="h3">
            Data
          </Typography>
          <Typography className={scss.pageDescription}>
            Explore the underlying records powering your revenue analytics
            workspace.
          </Typography>
        </div>

        <Chip
          className={scss.recordChip}
          label={`${(data.rows.length || ROW_LENGTH).toLocaleString()} records`}
          variant="outlined"
        />
      </section>

      <Paper
        className={scss.tableCard}
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
              Commodity records
            </Typography>
            <Typography className={scss.tableSubtitle}>
              Search, filter, select, and export operational data.
            </Typography>
          </div>

          <div className={scss.toolbarActions}>
            <TextField
              className={scss.searchInput}
              onChange={handleSearchChange}
              placeholder="Search records"
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
              disabled={loading}
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
              {...data}
              apiRef={apiRef}
              checkboxSelection
              disableRowSelectionOnClick
              filterModel={filterModel}
              loading={loading}
              onFilterModelChange={setFilterModel}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                ...data.initialState,
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
              }}
              slots={{
                loadingOverlay: () => <LinearProgress />,
              }}
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

export default Data;
