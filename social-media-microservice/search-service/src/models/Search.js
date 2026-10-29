import mongoose from "mongoose";

const searchPostSchema = mongoose.Schema(
  {
    PostId: {
      type: String,
      required: true,
      unique: true,
    },
    UserId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

searchPostSchema.index({ content: "text" });
searchPostSchema.index({ createdAt: -1 });

const Search = mongoose.model("Search", searchPostSchema);
export default Search;
