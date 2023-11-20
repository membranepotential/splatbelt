.PHONY: all clean

ifndef PROJECT_ID
$(error PROJECT_ID is not set. Usage: make PROJECT_ID=<project_id> CONFIG=<config_json>)
endif

ifndef CONFIG
$(error CONFIG is not set. Usage: make PROJECT_ID=<project_id> CONFIG=<config_json>)
endif

define getConfig
$(shell echo '$(CONFIG)' | jq -cr '.$(1)' -)
endef

export TQDM_DISABLE = 1

all: store_model

# Pull uploads
uploads:
	s3.sh load $(PROJECT_ID) $@

# Process images and videos
images: uploads
	process_uploads.py -u $< -f '$(call getConfig, "frames")' -o $@

# Create pairing
pairs.txt: images
	pairing.py -i $< -c '$(call getConfig, "pairing")' -o $@

# Extract features
features: images
	features.py extract -c '$(CONFIG)' -i $< -d database.db

# Match features
database.db: pairs.txt features
	features.py match -c '$(CONFIG)' -p $< -d $@

# Colmap mapping
distorted/sparse/0: images database.db
	mkdir -p distorted/sparse
	colmap mapper --image_path images --database_path database.db --output_path distorted/sparse --Mapper.ba_global_function_tolerance=1e-6 2>&1 | grep --line-buffered -E "^Registering|^Loading"
	select_largest_model.py distorted/sparse -i images

# Colmap refine intrinsics
refined_model: distorted/sparse/0
	colmap bundle_adjuster --input_path $< --output_path $< --BundleAdjustment.refine_principal_point 1 2>&1 >/dev/null

# Colmap undistort
undistorted: refined_model images
	colmap image_undistorter --image_path images --input_path distorted/sparse/0 --output_path undistorted --output_type COLMAP 2>&1 >/dev/null
	mv undistorted/sparse undistorted/0 && mkdir undistorted/sparse && mv undistorted/0 undistorted/sparse/0
	colmap model_analyzer --path undistorted/sparse/0

# Gaussian splatting
model: undistorted
	mkdir -p model
	gaussian_splatting_cuda -d $< -o $@ -i $(call getConfig, "numIter")

# Store model
store_model: model
	s3.sh store $(PROJECT_ID) $<

clean:
	rm -rf images pairs.txt features.h5 matches.h5 database.db distorted undistorted model

